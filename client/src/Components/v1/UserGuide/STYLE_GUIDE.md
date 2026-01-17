# Checkmate User Guide Style Guide

This document defines the writing standards, formatting rules, and content patterns for all Checkmate user documentation.

---

## Voice & Tone

### Core Principles

1. **Second person, active voice** - Address the reader directly
   - ✅ "You can configure monitors from the dashboard"
   - ❌ "Monitors can be configured from the dashboard"

2. **Professional but approachable** - Clear and helpful, not stiff or overly casual
   - ✅ "Select the notification channel you want to use"
   - ❌ "Go ahead and pick whatever notification channel works for you!"
   - ❌ "The user shall select the appropriate notification channel"

3. **Direct and instructional** - Tell users what to do, not what the system does
   - ✅ "Click Save to apply your changes"
   - ❌ "The Save button will apply your changes"

4. **User-focused** - Lead with what users can accomplish
   - ✅ "You can track server performance with infrastructure monitors"
   - ❌ "Infrastructure monitors use the Capture agent to collect metrics"

### Language Patterns

**Opening phrases:**
- "The [Feature] allows you to..."
- "[Feature] is..."
- "You can..."
- "To [action]:"

**Navigation instructions:**
- "Navigate to [location]"
- "Click [element]"
- "Select [option]"
- "From the [page], click..."

**Avoid:**
- Passive voice where active is clearer
- Jargon without explanation
- Assuming prior knowledge
- Marketing language ("powerful", "seamless", "robust")

---

## Content Structure

### Standard Article Pattern

Every article should follow this flow:

```
1. OVERVIEW (H2)
   - 1-2 paragraphs explaining what and why
   - Set context for the topic

2. VISUAL (Optional)
   - Screenshot showing the feature
   - Include after intro, not before

3. MAIN CONTENT (H2/H3 sections)
   - Procedures with ordered lists
   - Features with bullet lists
   - Reference info in tables

4. TIPS & WARNINGS (Callouts)
   - Best practices
   - Common pitfalls
   - Important restrictions

5. RELATED ARTICLES (Links)
   - 2-4 related topics
   - Logical next steps
```

### Heading Hierarchy

Use only two heading levels within articles:

- **H2** - Major sections (Overview, Configuration, Settings)
- **H3** - Subsections within H2s (Creating a monitor, Editing settings)

Never use H4 or deeper. If content requires more nesting, restructure into separate sections.

### Section Length

| Element | Target Length |
|---------|---------------|
| Paragraphs | 2-4 sentences |
| H2 sections | 100-300 words |
| H3 sections | 50-150 words |
| Full articles | 800-1500 words |

---

## Formatting Rules

### Lists

**Bullet lists** - Use for features, options, characteristics (unordered items)
```javascript
{
  type: 'bullet-list',
  items: [
    { text: 'HTTP monitors check website availability' },
    { text: 'Ping monitors verify server reachability' },
    { text: 'Port monitors test specific service ports' }
  ]
}
```

**Ordered lists** - Use for step-by-step procedures (sequential actions)
```javascript
{
  type: 'ordered-list',
  items: [
    { text: 'Navigate to **Uptime** in the sidebar' },
    { text: 'Click **Create monitor**' },
    { text: 'Enter the URL you want to monitor' },
    { text: 'Click **Save** to create the monitor' }
  ]
}
```

**List guidelines:**
- Keep procedures to 4-6 steps maximum
- If longer, break into multiple procedures
- Start each item with an action verb for procedures
- Use parallel structure (all items same grammatical form)

### Callouts

Use callouts sparingly for important information that shouldn't be missed.

**Types:**

| Variant | Use For | Example |
|---------|---------|---------|
| `info` | Additional context, clarification | "Monitors check at the interval you specify, starting from creation time." |
| `tip` | Best practices, recommendations | "Use descriptive names to easily identify monitors in alerts." |
| `warning` | Restrictions, potential issues | "Deleting a monitor removes all associated check history." |
| `success` | Confirmations, positive outcomes | "Your monitor is now active and checking every 5 minutes." |

```javascript
{
  type: 'callout',
  variant: 'tip',
  title: 'Best practice',
  text: 'Group related monitors together for easier management.'
}
```

**Callout guidelines:**
- Maximum 2-3 callouts per article
- Keep callout text concise (1-2 sentences)
- Title is optional but helps scannability
- Don't use callouts for routine information

### Inline Formatting

**Bold** - Use for:
- UI element names: "Click **Save**"
- Key terms on first use: "**Uptime** measures availability over time"
- Emphasis in lists: "**Name** — The display name for your monitor"

**Code/monospace** - Use for:
- URLs: `https://example.com`
- File paths: `/api/v1/monitors`
- Technical values: `200`, `timeout`
- Commands: `npm run dev`

```javascript
// In paragraph text, use backticks in markdown:
{ text: 'Enter the URL (e.g., `https://example.com`) in the field' }
```

### Tables

Use tables for:
- Feature comparisons
- Configuration options
- Reference data with multiple attributes

```javascript
{
  type: 'table',
  columns: [
    { key: 'type', label: 'Monitor Type', width: '1fr' },
    { key: 'use', label: 'Best For', width: '2fr' }
  ],
  rows: [
    { type: 'HTTP', use: 'Websites and APIs' },
    { type: 'Ping', use: 'Server availability' },
    { type: 'Port', use: 'Specific services (databases, mail servers)' }
  ]
}
```

---

## Content Types

### Block Types Reference

| Type | Purpose | When to Use |
|------|---------|-------------|
| `heading` | Section titles | Start each major topic |
| `paragraph` | Body text | Explanations, context |
| `bullet-list` | Unordered items | Features, options |
| `ordered-list` | Sequential steps | Procedures |
| `checklist` | Checkable items | Requirements, checklists |
| `callout` | Important notices | Tips, warnings |
| `code` | Code blocks | Commands, config examples |
| `table` | Structured data | Comparisons, reference |
| `image` | Screenshots | UI demonstration |
| `icon-cards` | Feature grids | Capability overviews |
| `article-links` | Related content | End-of-article navigation |

### Icon Cards

Use for presenting 4-8 related features or concepts:

```javascript
{
  type: 'icon-cards',
  items: [
    {
      icon: 'Globe',
      title: 'HTTP monitoring',
      description: 'Check website availability and response times'
    },
    {
      icon: 'Server',
      title: 'Infrastructure',
      description: 'Monitor CPU, memory, and disk usage'
    }
  ]
}
```

### Article Links

Always end articles with related content:

```javascript
{
  type: 'article-links',
  title: 'Related articles',
  items: [
    {
      collectionId: 'uptime-monitoring',
      articleId: 'http-monitors',
      title: 'Creating HTTP monitors',
      description: 'Set up your first website monitor'
    }
  ]
}
```

---

## Images & Screenshots

### When to Include Images

- After introducing a feature (not before)
- For complex UI that benefits from visual reference
- For multi-step workflows
- Skip for simple, text-describable actions

### Image Requirements

```javascript
{
  type: 'image',
  src: '/images/user-guide/monitor-create.png',
  alt: 'Monitor creation form showing URL field, name field, and interval selector',
  caption: 'The monitor creation form with required fields highlighted'
}
```

**Alt text guidelines:**
- Describe what the image shows (15-30 words)
- Include key UI elements visible
- Make it useful for screen readers

**Caption guidelines:**
- Explain the context or what to notice
- Keep to one sentence
- Optional but recommended

### Screenshot Standards

- Capture at consistent browser width (1200px recommended)
- Use light theme for screenshots
- Highlight relevant areas if needed
- Avoid personal data in screenshots
- Crop to show relevant UI only

---

## Writing Procedures

### Step-by-Step Instructions

**Format:**
```javascript
{
  type: 'ordered-list',
  items: [
    { text: 'Navigate to **Uptime** in the sidebar' },
    { text: 'Click **Create monitor** in the top right' },
    { text: 'Enter the URL you want to monitor' },
    { text: 'Set the check interval (default: 5 minutes)' },
    { text: 'Click **Save** to create the monitor' }
  ]
}
```

**Guidelines:**
- Start each step with an action verb (Click, Enter, Select, Navigate)
- One action per step
- Include the location of UI elements
- Bold all clickable elements
- Add context in parentheses when helpful

### Describing Features

**Format:**
```javascript
{
  type: 'bullet-list',
  items: [
    { bold: 'Name', text: 'A descriptive label for your monitor' },
    { bold: 'URL', text: 'The address to check (must include protocol)' },
    { bold: 'Interval', text: 'How often to perform checks (1-60 minutes)' }
  ]
}
```

---

## Terminology

### Consistent Terms

Use these terms consistently throughout documentation:

| Term | Use | Don't Use |
|------|-----|-----------|
| Monitor | The configured check | Watcher, probe, check |
| Check | A single monitoring event | Ping, request, poll |
| Incident | A detected problem | Outage, alert, issue |
| Notification | Alert sent to user | Message, email, ping |
| Dashboard | Main overview page | Home, overview |
| Sidebar | Left navigation | Menu, nav |

### Feature Names

Always match UI exactly:
- **Uptime** (not "Uptime Monitoring")
- **PageSpeed** (not "Page Speed" or "Pagespeed")
- **Infrastructure** (not "Server Monitoring")
- **Status pages** (not "Status Pages" - lowercase 'p')

---

## Article Templates

### Getting Started Article

```javascript
{
  blocks: [
    {
      type: 'heading',
      level: 2,
      text: 'Overview',
      id: 'overview'
    },
    {
      type: 'paragraph',
      text: '[1-2 sentences: What this feature/concept is]'
    },
    {
      type: 'paragraph',
      text: '[1-2 sentences: Why it matters to users]'
    },
    {
      type: 'heading',
      level: 2,
      text: '[Main topic]',
      id: 'main-topic'
    },
    // ... content blocks
    {
      type: 'article-links',
      title: 'Next steps',
      items: [
        // 2-3 logical next articles
      ]
    }
  ]
}
```

### How-To Article

```javascript
{
  blocks: [
    {
      type: 'heading',
      level: 2,
      text: 'Overview',
      id: 'overview'
    },
    {
      type: 'paragraph',
      text: '[Brief description of what user will accomplish]'
    },
    {
      type: 'heading',
      level: 2,
      text: '[Action: Creating/Configuring/Setting up...]',
      id: 'action'
    },
    {
      type: 'ordered-list',
      items: [
        // 4-6 steps
      ]
    },
    {
      type: 'callout',
      variant: 'tip',
      text: '[Best practice or helpful hint]'
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: []
    }
  ]
}
```

### Reference Article

```javascript
{
  blocks: [
    {
      type: 'heading',
      level: 2,
      text: 'Overview',
      id: 'overview'
    },
    {
      type: 'paragraph',
      text: '[What this reference covers]'
    },
    {
      type: 'heading',
      level: 2,
      text: '[Category 1]',
      id: 'category-1'
    },
    {
      type: 'table',
      columns: [...],
      rows: [...]
    },
    // More categories as needed
    {
      type: 'article-links',
      title: 'Related articles',
      items: []
    }
  ]
}
```

---

## Quality Checklist

Before publishing any article, verify:

### Content
- [ ] Overview explains what AND why
- [ ] Procedures are tested and accurate
- [ ] All UI element names match exactly
- [ ] No assumptions about user knowledge
- [ ] Related articles are linked

### Formatting
- [ ] Only H2 and H3 headings used
- [ ] All headings have unique IDs
- [ ] Lists use correct type (bullet vs ordered)
- [ ] Callouts are used sparingly (max 3)
- [ ] Bold used for UI elements

### Style
- [ ] Active voice throughout
- [ ] Second person ("you")
- [ ] Action verbs start procedure steps
- [ ] Consistent terminology
- [ ] No marketing language

### Technical
- [ ] All links work
- [ ] Images have alt text
- [ ] Code examples are correct
- [ ] No placeholder content

---

## Available Icons

For icon-cards and other icon references, use these Lucide icon names:

**Navigation:**
- `Globe` - Uptime/HTTP
- `Gauge` - PageSpeed
- `Server` - Infrastructure
- `Bell` - Notifications
- `AlertTriangle` - Incidents
- `Wifi` - Status pages
- `Wrench` - Maintenance
- `Settings` - Settings
- `Users` - Team

**Actions:**
- `CheckCircle` - Success/complete
- `Clock` - Time/scheduling
- `Info` - Information
- `Lightbulb` - Tips
- `ArrowRight` - Navigation

**Features:**
- `Database` - Data/storage
- `Terminal` - Commands
- `FileText` - Documentation
- `Shield` - Security
- `Rocket` - Getting started

---

## File Structure

Articles are stored in `/content/index.js`:

```javascript
export const articleContents = {
  'collection-id': {
    'article-id': {
      blocks: [
        // Content blocks
      ]
    }
  }
};
```

Article metadata is in `/content/userGuideConfig.js`:

```javascript
{
  id: 'article-id',
  title: 'Article Title',
  description: 'Brief description for search and previews',
  keywords: ['search', 'terms', 'for', 'this', 'article']
}
```

---

## Examples

### Good Paragraph
> "HTTP monitors check your websites and APIs at regular intervals. When a check fails—due to a timeout, error response, or connection issue—Checkmate creates an incident and sends notifications to your configured channels."

### Good Procedure
> 1. Navigate to **Uptime** in the sidebar
> 2. Click **Create monitor** in the top right
> 3. Enter the URL you want to monitor (include `https://`)
> 4. Set your preferred check interval
> 5. Click **Save** to create the monitor

### Good Callout
> **Tip:** Use descriptive monitor names like "Production API" or "Marketing Website" to quickly identify issues in notifications.

### Good Feature List
> - **Name** — A descriptive label for easy identification
> - **URL** — The address to monitor (must include protocol)
> - **Interval** — How often to check (1-60 minutes)
> - **Timeout** — How long to wait before marking as failed

---

*Last updated: January 2025*
