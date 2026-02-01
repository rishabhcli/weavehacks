/**
 * Crawler Agent
 *
 * Crawls web applications using Browserbase and Stagehand to discover
 * user flows and automatically generate test specifications.
 *
 * Uses Stagehand's observe() method to identify interactive elements
 * and generates test specs based on discovered patterns.
 */

import { Stagehand, type Page } from '@browserbasehq/stagehand';
import type { TestSpec, TestStep } from '@/lib/types';
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

    // Use OpenAI by default for better compatibility
    this.stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey,
      projectId,
      modelName: 'gpt-4o',
      modelClientOptions: {
        apiKey: process.env.OPENAI_API_KEY,
      },
      verbose: process.env.DEBUG === 'true' ? 1 : 0,
    });

    await this.stagehand.init();

    // Capture the session ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.sessionId = (this.stagehand as any).browserbaseSessionID || null;
  }

  /**
   * Get the current session ID for debugging
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get the current page from stagehand context
   */
  private getPage(): Page {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }
    const pages = this.stagehand.context.pages();
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

    if (!this.stagehand) {
      await this.init();
    }

    try {
      await this.crawlPage(baseUrl, 0, opts);
    } catch (error) {
      console.error('Error during crawl:', error);
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

    const page = this.getPage();

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: options.timeout || 30000,
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
      // Use observe to find clickable elements
      const clickableObservations = await this.stagehand.observe(
        'Find all clickable buttons and links on this page'
      );

      for (const obs of clickableObservations) {
        elements.push({
          selector: obs.selector,
          type: obs.selector.includes('button') || obs.selector.includes('btn') ? 'button' : 'link',
          text: obs.description || undefined,
        });
      }

      // Find form inputs
      const inputObservations = await this.stagehand.observe(
        'Find all input fields and text areas on this page'
      );

      for (const obs of inputObservations) {
        elements.push({
          selector: obs.selector,
          type: 'input',
          placeholder: obs.description || undefined,
        });
      }

      // Find forms
      const formObservations = await this.stagehand.observe(
        'Find all forms on this page including login, signup, and contact forms'
      );

      for (const obs of formObservations) {
        elements.push({
          selector: obs.selector,
          type: 'form',
          action: obs.description || undefined,
        });
      }
    } catch (error) {
      console.error('Error discovering elements:', error);
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
    const page = this.getPage();
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
    const page = this.getPage();
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
      await this.stagehand.close();
      this.stagehand = null;
    }
  }
}

export default CrawlerAgent;
