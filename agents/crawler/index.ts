/**
 * Crawler Agent
 *
 * Crawls web applications using Browserbase and Stagehand to discover
 * user flows and automatically generate test specifications.
 *
 * Uses Stagehand's observe() method to identify interactive elements
 * and generates test specs based on discovered patterns.
 *
 * Features:
 * - Discovers clickable elements, forms, and inputs
 * - Generates test flows based on page structure
 * - Supports multi-page crawling with depth limits
 */

import { Stagehand, type Page } from '@browserbasehq/stagehand';
import type { TestSpec } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export type FlowType = 'navigation' | 'form' | 'action' | 'auth';

export interface DiscoveredElement {
  selector: string;
  type: 'link' | 'button' | 'input' | 'form' | 'select';
  text?: string;
  placeholder?: string;
  href?: string;
  action?: string;
}

export interface DiscoveredFlow {
  name: string;
  url: string;
  type: FlowType;
  steps: Array<{ action: string; expected?: string }>;
  confidence: number;
  elements: DiscoveredElement[];
}

export interface CrawlerOptions {
  maxPages?: number;
  maxDepth?: number;
  timeout?: number;
  includeAuth?: boolean;
}

const DEFAULT_OPTIONS: CrawlerOptions = {
  maxPages: 5,
  maxDepth: 2,
  timeout: 30000,
  includeAuth: true,
};

export class CrawlerAgent {
  private stagehand: Stagehand | null = null;
  private visitedUrls: Set<string> = new Set();
  private discoveredFlows: DiscoveredFlow[] = [];
  private sessionId: string | null = null;

  /**
   * Initialize Stagehand with Browserbase
   */
  async init(): Promise<void> {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    const projectId = process.env.BROWSERBASE_PROJECT_ID;

    if (!apiKey || !projectId) {
      throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required');
    }

    console.log('[CrawlerAgent] Initializing Stagehand with Browserbase...');
    console.log(`[CrawlerAgent] Project ID: ${projectId.slice(0, 8)}...`);

    // Use Gemini if GOOGLE_API_KEY is set, otherwise fall back to OpenAI
    const useGemini = !!process.env.GOOGLE_API_KEY;
    console.log(`[CrawlerAgent] Using model: ${useGemini ? 'gemini-2.0-flash' : 'gpt-4o'}`);

    this.stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey,
      projectId,
      model: useGemini
        ? {
            modelName: 'gemini-2.0-flash',
            apiKey: process.env.GOOGLE_API_KEY,
          }
        : {
            modelName: 'gpt-4o',
            apiKey: process.env.OPENAI_API_KEY,
          },
      verbose: process.env.DEBUG === 'true' ? 1 : 0,
    });

    await this.stagehand.init();
    console.log('[CrawlerAgent] Stagehand initialized successfully');

    this.captureSessionId();
  }

  /**
   * Get the current session ID for debugging
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  private captureSessionId(): void {
    if (!this.stagehand) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Prefer public getter, but fall back to internal field name if needed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stagehandAny = this.stagehand as any;
    const nextSessionId =
      stagehandAny.browserbaseSessionID || stagehandAny.browserbaseSessionId || null;
    if (nextSessionId && nextSessionId !== this.sessionId) {
      this.sessionId = nextSessionId;
      console.log(`[CrawlerAgent] Browserbase session ID: ${this.sessionId}`);
      console.log(`[CrawlerAgent] Live view: https://browserbase.com/sessions/${this.sessionId}`);
    }
  }

  /**
   * Get or create a page from stagehand context
   */
  private async getPage(): Promise<Page> {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    if (!this.stagehand.context) {
      throw new Error('Stagehand context not available');
    }

    let pages = this.stagehand.context.pages();

    // If no pages exist, create one
    if (!pages || pages.length === 0) {
      console.log('[CrawlerAgent] No pages found, creating new page...');
      const newPage = await this.stagehand.context.newPage();
      this.captureSessionId();
      return newPage;
    }

    this.captureSessionId();
    return pages[0];
  }

  /**
   * Discover flows by crawling the application
   */
  async discoverFlows(
    baseUrl: string,
    options: CrawlerOptions = {}
  ): Promise<DiscoveredFlow[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.visitedUrls.clear();
    this.discoveredFlows = [];

    console.log(`\n[CrawlerAgent] Starting crawl of ${baseUrl}`);
    console.log(`[CrawlerAgent] Options: maxPages=${opts.maxPages}, maxDepth=${opts.maxDepth}`);

    if (!this.stagehand) {
      await this.init();
    }

    try {
      await this.crawlPage(baseUrl, 0, opts);
      console.log(`\n[CrawlerAgent] Crawl complete. Discovered ${this.discoveredFlows.length} flows.`);
    } catch (error) {
      console.error('[CrawlerAgent] Error during crawl:', error);
    }

    return this.discoveredFlows;
  }

  /**
   * Crawl a single page and discover elements/flows
   */
  private async crawlPage(
    url: string,
    depth: number,
    options: CrawlerOptions
  ): Promise<void> {
    if (this.visitedUrls.has(url)) return;
    if (depth >= (options.maxDepth || 2)) return;
    if (this.visitedUrls.size >= (options.maxPages || 5)) return;

    this.visitedUrls.add(url);

    const page = await this.getPage();
    console.log(`[CrawlerAgent] Crawling: ${url}`);

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeoutMs: options.timeout || 30000,
      });

      // Discover elements on the page using Stagehand's observe
      const elements = await this.discoverElements();

      // Generate flows based on discovered elements
      await this.generateFlowsFromElements(url, elements, options);

      // Find links to crawl next
      const links = await this.extractLinks(url);
      for (const link of links) {
        if (this.visitedUrls.size >= (options.maxPages || 5)) break;
        await this.crawlPage(link, depth + 1, options);
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  /**
   * Discover interactive elements on the current page using Stagehand observe
   */
  private async discoverElements(): Promise<DiscoveredElement[]> {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    const elements: DiscoveredElement[] = [];

    try {
      console.log('[CrawlerAgent] Discovering clickable elements...');
      // Use observe to find clickable elements
      const clickableObservations = await this.stagehand.observe(
        'Find all clickable buttons and links on this page'
      );
      console.log(`[CrawlerAgent] Found ${clickableObservations?.length || 0} clickable elements`);

      for (const obs of clickableObservations || []) {
        elements.push({
          selector: obs.selector,
          type: obs.selector.includes('button') || obs.selector.includes('btn') ? 'button' : 'link',
          text: obs.description || undefined,
        });
      }

      console.log('[CrawlerAgent] Discovering input fields...');
      // Find form inputs
      const inputObservations = await this.stagehand.observe(
        'Find all input fields and text areas on this page'
      );
      console.log(`[CrawlerAgent] Found ${inputObservations?.length || 0} input fields`);

      for (const obs of inputObservations || []) {
        elements.push({
          selector: obs.selector,
          type: 'input',
          placeholder: obs.description || undefined,
        });
      }

      console.log('[CrawlerAgent] Discovering forms...');
      // Find forms
      const formObservations = await this.stagehand.observe(
        'Find all forms on this page including login, signup, and contact forms'
      );
      console.log(`[CrawlerAgent] Found ${formObservations?.length || 0} forms`);

      for (const obs of formObservations || []) {
        elements.push({
          selector: obs.selector,
          type: 'form',
          action: obs.description || undefined,
        });
      }

      console.log(`[CrawlerAgent] Total elements discovered: ${elements.length}`);
    } catch (error) {
      console.error('[CrawlerAgent] Error discovering elements:', error);
    }

    return elements;
  }

  /**
   * Generate test flows based on discovered elements
   */
  private async generateFlowsFromElements(
    url: string,
    elements: DiscoveredElement[],
    options: CrawlerOptions
  ): Promise<void> {
    const page = await this.getPage();
    const pageTitle = await page.evaluate(() => document.title);

    // Identify navigation flows (link clicks)
    const links = elements.filter((e) => e.type === 'link' && e.text);
    for (const link of links.slice(0, 3)) { // Limit to 3 nav flows per page
      this.discoveredFlows.push({
        name: `Navigate to ${link.text || 'page'}`,
        url,
        type: 'navigation',
        steps: [
          { action: `Click on "${link.text}"` },
          { action: `Verify navigation`, expected: `I see the ${link.text} page or section` },
        ],
        confidence: 0.7,
        elements: [link],
      });
    }

    // Identify form flows
    const forms = elements.filter((e) => e.type === 'form');
    for (const form of forms) {
      const inputs = elements.filter((e) => e.type === 'input');
      const buttons = elements.filter((e) => e.type === 'button');

      if (inputs.length > 0) {
        const isAuthForm = form.action?.toLowerCase().includes('login') ||
          form.action?.toLowerCase().includes('signup') ||
          form.action?.toLowerCase().includes('auth');

        if (isAuthForm && !options.includeAuth) continue;

        const steps: Array<{ action: string; expected?: string }> = [];

        for (const input of inputs.slice(0, 3)) { // Limit inputs
          steps.push({
            action: `Type test value into "${input.placeholder || 'input field'}"`,
          });
        }

        if (buttons.length > 0) {
          steps.push({
            action: `Click on "${buttons[0].text || 'submit button'}"`,
          });
        }

        steps.push({
          action: 'Verify form submission',
          expected: 'I see a success message or the form is processed',
        });

        this.discoveredFlows.push({
          name: isAuthForm
            ? `${form.action?.includes('login') ? 'Login' : 'Signup'} Flow`
            : `Form submission on ${pageTitle}`,
          url,
          type: isAuthForm ? 'auth' : 'form',
          steps,
          confidence: isAuthForm ? 0.85 : 0.75,
          elements: [form, ...inputs, ...buttons.slice(0, 1)],
        });
      }
    }

    // Identify action flows (button clicks)
    const actionButtons = elements.filter(
      (e) => e.type === 'button' && e.text && !e.text.toLowerCase().includes('submit')
    );

    for (const button of actionButtons.slice(0, 3)) {
      this.discoveredFlows.push({
        name: `Click ${button.text}`,
        url,
        type: 'action',
        steps: [
          { action: `Click on "${button.text}" button` },
          { action: 'Verify action result', expected: `I see the result of the ${button.text} action` },
        ],
        confidence: 0.65,
        elements: [button],
      });
    }
  }

  /**
   * Extract internal links from the current page
   */
  private async extractLinks(baseUrl: string): Promise<string[]> {
    const page = await this.getPage();
    const baseUrlObj = new URL(baseUrl);

    const links = await page.evaluate((hostname) => {
      const anchors = document.querySelectorAll('a[href]');
      const urls: string[] = [];

      anchors.forEach((a) => {
        const href = a.getAttribute('href');
        if (!href) return;

        try {
          // Handle relative URLs
          const url = new URL(href, window.location.origin);

          // Only include internal links
          if (url.hostname === hostname) {
            // Skip hash links, javascript:, and common non-page links
            if (
              !url.pathname.includes('#') &&
              !href.startsWith('javascript:') &&
              !href.startsWith('mailto:') &&
              !url.pathname.match(/\.(pdf|jpg|png|gif|css|js)$/i)
            ) {
              urls.push(url.href);
            }
          }
        } catch {
          // Invalid URL, skip
        }
      });

      return [...new Set(urls)];
    }, baseUrlObj.hostname);

    return links;
  }

  /**
   * Convert discovered flows to test specs
   */
  flowsToTestSpecs(flows: DiscoveredFlow[]): TestSpec[] {
    return flows.map((flow) => ({
      id: uuidv4(),
      name: flow.name,
      url: flow.url,
      steps: flow.steps.map((step) => ({
        action: step.action,
        expected: step.expected,
      })),
      timeout: 30000,
    }));
  }

  /**
   * Close the browser session
   */
  async close(): Promise<void> {
    if (this.stagehand) {
      console.log('[CrawlerAgent] Closing Browserbase session...');
      try {
        await this.stagehand.close();
        console.log('[CrawlerAgent] Session closed successfully');
      } catch (error) {
        console.error('[CrawlerAgent] Error closing session:', error);
      } finally {
        this.stagehand = null;
      }
    }
  }
}

export default CrawlerAgent;
