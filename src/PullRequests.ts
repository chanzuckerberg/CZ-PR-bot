import { context, getOctokit } from "@actions/github";

interface CommentNode {
  body: string;
}
interface PullRequestDetailsResponse {
  repository: {
    pullRequest: {
      headRef: {
        name: string;
        target: {
          oid: string;
        };
      };
      body: string;
      comments: {
        nodes: CommentNode[];
      };
    };
  };
}

export async function isPullRequest(token: string) {
  const client = getOctokit(token);

  const {
    data: { pull_request },
  } = await client.rest.issues.get({
    ...context.repo,
    issue_number: context.issue.number,
  });

  return !!pull_request;
}

export async function pullRequestDetails(token: string) {
  const client = getOctokit(token);

  const {
    repository: {
      pullRequest: { headRef, body, comments },
    },
  } = await client.graphql<PullRequestDetailsResponse>(
    `
      query pullRequestDetails($repo:String!, $owner:String!, $number:Int!) {
        repository(name: $repo, owner: $owner) {
          pullRequest(number: $number) {
            headRef {
              name
              target {
                oid
              }
            }
            body
            comments (first: 100) {
              nodes {
                body
              }
            }
          }
        }
      }
    `,
    {
      ...context.repo,
      number: context.issue.number,
    }
  );

  return {
    head_sha: headRef.target.oid,
    body,
    comments,
  };
}
