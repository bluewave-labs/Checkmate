## The Importance of Small Pull Requests


Pull requests are an integral part of our workflow, but does the scope of your pull request matter?  In my opinion yes, it does, and here’s why I think so

### Smaller PRs make you spend more time thinking about your code before you write it

Spend some time thinking about the PR you are going to open.  If you think about the scope of the PR you will be forced to limit the scope of your feature, and that will force you to plan your code out.

### Smaller PRs are easier to review

If a PR is massive and complicated it is very difficult to review.  Reviewers are busy working on their own features and can quickly run into cognitive limits when a large PR comes in.  A PR should be simple enough that a busy dev can jump on the review without fatiguing themself.

### Smaller PRs get better reviews

The smaller your PR, the greater the amount of quality feedback a reviewer can give you.  If you have 600 lines of code you are not going to get decent feedback at line 500.  Try to limit your PRs to 200 lines of code at the most in order to get quality feedback from your reviewers.

### Smaller PRs get reviewed faster and merged faster

If your PR is short and sweet your reviewers can get you feedback ASAP, this reduces the turnaround time for the whole pull request.  If it takes your reviewer a whole day to review your pull request you are looking at 2 days for the 

	Pull Request -> Review -> Revise -> Review -> Merge

Process.  If more revisions are required after the second review we’re looking at almost a week to get the feature reviewed, revised, and merged in.

### Smaller PRs lead to better quality code

If PRs are small and manageable it is far more likely that a dev will catch bugs during the review process.  If our eyes glaze over at line 400 of a 700 line PR since we’ve reached our cognitive limit we are unlikely to miss bugs in the last 300 lines of code.

### Bonus Topic:  Keep PRs focused

It may be tempting to address a bug you suddenly remembered or make some tiny adjustments in some component that bothers you, but don’t!  Keep all commits in your pull request fully focused on the specific feature you are working on.  Open up another PR if you want to fix a bug or work on another feature.
