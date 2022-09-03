import * as core from '@actions/core';
import * as github from '@actions/github';
import {PullRequest} from '@octokit/webhooks-definitions/schema';
import {Action} from '../action';
import {Output} from '../config/output';
import {Logger} from '../logging';

export class Github implements Action {
    publish(variable: string, output: Output): void {
        core.setOutput(variable, JSON.stringify(output));
    }

    markFailed(reason: string): never {
        core.setFailed(reason);
        process.exit(1);
    }

    getLogger(): Logger {
        return {
            debug(message: string): void {
                core.debug(message);
            },

            info(message: string): void {
                core.info(message);
            },

            error(message: string): void {
                core.error(message);
            },

            warning(message: string): void {
                core.warning(message);
            }
        };
    }

    getBaseBranchSha1(): string | null {
        if (github.context.eventName !== 'pull_request') {
            return null;
        }

        const pullRequestPayload = github.context.payload as PullRequest;

        return pullRequestPayload.base.sha;
    }
}
