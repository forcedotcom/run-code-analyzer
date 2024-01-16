# Contributing Guide for the 'Run Salesforce Code Analyzer' GitHub Action
> Currently, we aren't accepting external contributions. To know when we open for contributions, periodically check this guide.

To contribute to the Run Code Analyzer GitHub Action, read this guide to understand its operational governance model. This guide also provides contribution requirements and recommendations. Thanks for your interest and contributions.

# Governance Model

## Salesforce Sponsored

The intent and goal of open sourcing this project is to increase the contributor and user base. Note that Salesforce employees have `admin` rights and are the final arbiters which contributions are accepted.

# Issues, requests & ideas

To submit issues, enhancement requests, and discuss ideas, create an issue on the [Issues page](https://github.com/forcedotcom/run-code-analyzer/issues).

### Bug Reports and Fixes
-  If you find a bug, search for it in the [Issues](https://github.com/forcedotcom/run-code-analyzer/issues), and if it isn't already tracked,
   [create a new issue](https://github.com/forcedotcom/run-code-analyzer/issues/new). Fill out the "Bug Report" section of the issue template. Even if an issue is closed, feel free to comment and add details, it will still be reviewed.
-  Issues that have been confirmed as a bug will be labelled `bug`.
-  If you want to submit a bug fix, [create a pull request](#creating_a_pull_request) and mention the issue number.
-  In your bug fix pull request, include tests that isolate the bug and verify that it's fixed.

### New Features
-  To add new functionality to Run Code Analyzer, describe the problem you want to solve - or the enhancement you identifed - in a [new issue](https://github.com/forcedotcom/run-code-analyzer/issues/new).
-  Issues that are identified as a feature request are labelled `enhancement`.
-  Before writing the code for your newly requested feature, first wait for feedback from the project maintainers. In some cases, requested `enhancements` don't align well with the current project objectives.

### Tests, Documentation, Miscellaneous
-  We welcome your contributions to:
   - improving tests
   - clarifying documentation
   - requesting alternative implementations
-  If it's a trivial change, go ahead and [create a pull request](#creating_a_pull_request) with the changes you have in mind.
-  If your request is larger in size, [open an issue](https://github.com/forcedotcom/run-code-analyzer/issues/new) to get feedback on your idea.

# Contribution Checklist

- [x] Clean, simple, well styled code
- [x] Atomic commits and descriptive messages. Mention related issues by issue number
- [x] Comments
    - Module-level & function-level comments
    - Comments on complex blocks of code or algorithms (include references to sources)
- [x] Tests
    - Complete, passing test suite test suite (if provided)
    - Maintain or increase code coverage percentages
- [x] Dependencies
    - Minimize number of dependencies
    - Prefer Apache 2.0, BSD3, MIT, ISC and MPL licenses
- [x] Reviews
    - Approved peer code review changes

# Local Development

## Install Dependencies
Install required node dependencies:
```
npm install
```

## Running tests
We strive for 100% code coverage.
After making your changes, run your tests and check coverage with:
```
npm run test
```

## Before submitting
We use `ncc` to produce a single *index.js* file inside the *dist* directory from all the typescript source code.
Before you submit, create this package along with license files, and badges with:
```
npm run all
```

# Creating a Pull Request

1. **Ensure the bug or feature wasn't already reported** by searching on GitHub under Issues.  If none exists, create a new issue so that other contributors can keep track of what you are trying to add or fix and offer suggestions, or let you know if there is already an effort in progress.
3. **Clone** the forked repo to your machine.
4. **Create** a new branch to contain your work. Example: `git br fix-issue-11`
4. **Commit** changes to your own branch.
5. **Push** your work back up to your fork. Example: `git push fix-issue-11`
6. **Submit** a pull request against the `main` branch and refer to the issue you're fixing. Keep your pull request simple and small to avoid any unintended changes.
7. **Sign** the Salesforce Contributor License Agreement (CLA). You will be prompted to do so when submitting your pull request.

> **NOTE**: Be sure to [sync your fork](https://help.github.com/articles/syncing-a-fork/) before making a pull request.


# Code of Conduct
Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).

# License
By contributing your code, you agree to license your contribution under the terms of our project [LICENSE](LICENSE) and to sign the [Salesforce CLA](https://cla.salesforce.com/sign-cla)