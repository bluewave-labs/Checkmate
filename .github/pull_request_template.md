**(Please remove this line only before submitting your PR. Ensure that all relevant items are checked before submission.)** 

## Describe your changes

Briefly describe the changes you made and their purpose. 

## Write your issue number after "Fixes "

Fixes #123 

## Please ensure all items are checked off before requesting a review. "Checked off" means you need to add an "x" character between brackets so they turn into checkmarks.

- [ ] (Do not skip this or your PR will be closed) I deployed the application locally.
- [ ] (Do not skip this or your PR will be closed) I have performed a self-review and testing of my code.
- [ ] I have included the issue # in the PR.
- [ ] I have added i18n support to visible strings (instead of `<div>Add</div>`, use): 
```Javascript
const { t } = useTranslation();
<div>{t('add')}</div>
```
- [ ] I have **not** included any files that are not related to my pull request, including package-lock and package-json if dependencies have not changed
- [ ] I didn't use any hardcoded values (otherwise it will not scale, and will make it difficult to maintain consistency across the application).
- [ ] I made sure font sizes, color choices etc are all referenced from the theme. I have no hardcoded dimensions.
- [ ] My PR is granular and targeted to one specific feature.
- [ ] I took a screenshot or a video and attached to this PR if there is a UI change.

