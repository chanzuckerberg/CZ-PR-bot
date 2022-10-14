# GitHub Actions TODO Bot

This action parses the PR description and comments.  It sets commit status to success if there are no unfilled checkboxes.

## Using the Action

Create a new workflow YAML file under `.github/workflows/` folder.

Example:

```
name: CZ PR TODO Bot

on:
  pull_request:
    types: [opened, synchronize, reopened, edited]
  issue_comment:
    types: [created, edited, deleted]
  pull_request_review_comment:
    types: [created, edited, deleted]

jobs:
  todo_check:
    name: PR Checkboxes
    runs-on: ubuntu-latest
    steps:
    - uses: chanzuckerberg/CZ-PR-bot@main
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Development / Release

* The default target branch for code changes is `main`
* To prepare a test version:
  * Clone the repo and make changes
    * During development you will likely want to point the workflow to your branch using `uses: chanzuckerberg/CZ-PR-bot@your-branch-name` rather than `chanzuckerberg/CZ-PR-bot@main`
  * Ensure .gitignore file does not exclude `node_modules` folder
  * Run `npm run build` to transpile ts to js
  * Commit all the changes
* To release a version:
  * Tag the target commit from the main branch
