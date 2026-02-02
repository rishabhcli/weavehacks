/**
 * Git Utilities
 *
 * Exports all git-related utilities for cloning repositories,
 * managing local development environments, and pushing fixes.
 */

export {
  cloneRepository,
  detectPackageManager,
  installDependencies,
  findAvailablePort,
  startDevServer,
  waitForServerReady,
  cloneAndInstall,
  setupLocalRepo,
  createFixBranch,
  commitAndPush,
  cleanupRepo,
  type PackageManager,
  type SetupOptions,
} from './clone';

export { createPullRequest } from '@/lib/github/patches';
