# Prompt Forge AI

Prompt Forge AI — Production-Ready App Build Prompt

Build a premium, production-ready AI prompt engineering platform called “Prompt Forge AI”. The application must have a first-class modern UI, smooth animations, responsive design, and fully working functionality. Do not create a static mockup. Every major button, interaction, form, navigation item, and AI workflow must actually work.

1. Product Vision

Prompt Forge AI is an intelligent workspace where users can:

Create high-quality AI prompts from simple ideas

Improve and optimize existing prompts

Transform prompts for different AI models

Test prompts

Compare prompt versions

Generate structured prompts

Save prompts to a personal library

Organize prompts into folders

Search and filter prompts

Copy/export prompts

View prompt history and versions

Rate/evaluate generated prompts

Generate prompts for different use cases

Switch between different AI models

Manage settings and API configuration

The overall experience should feel like a combination of Linear + Vercel + ChatGPT + Notion, but with its own distinctive visual identity.

2. Technology Stack

Use a modern production stack:

Next.js 15+ with App Router

TypeScript

React

Tailwind CSS

shadcn/ui

Framer Motion

Lucide React icons

PostgreSQL or Supabase for persistence

Prisma if PostgreSQL is used

Authentication with Supabase Auth or Auth.js

AI provider abstraction supporting:

OpenAI

Google Gemini

Anthropic

Zod for validation

React Hook Form

Server Actions/API routes for backend operations

The application must be deployable on Vercel.

Do not use Streamlit.

3. Visual Design

Create a premium SaaS interface.

Design language

Dark-first interface

Optional light mode

Deep charcoal/black background

Subtle gradients

Glassmorphism used carefully

Thin borders

Soft shadows

Rounded cards

High-quality typography

Excellent spacing

Minimal visual clutter

Professional developer-tool aesthetic

Subtle purple/blue accent gradients

Micro-interactions everywhere appropriate

Do not make the interface look like a generic AI dashboard.

Use:

Animated gradient backgrounds

Subtle grid/noise texture

Smooth page transitions

Hover states

Button press animations

Loading skeletons

Streaming AI responses

Animated progress indicators

Toast notifications

Command palette

Keyboard shortcuts

Animations must be smooth and purposeful, not excessive.

4. Landing Page

Create a premium landing page.

Hero section:

PROMPT FORGE AI

Headline:

Turn Ideas Into Powerful AI Prompts.

Subheading:

“Engineer, optimize, test, and manage production-ready prompts with AI.”

Primary CTA:

Start Forging

Secondary CTA:

Explore Features

Hero visualization should show an animated prompt editor with:

User input

AI processing animation

Generated prompt

Quality score

Optimization indicators

Add animated floating cards around the main interface.

Sections:

Prompt Engineering

AI Optimization

Prompt Testing

Version Control

Prompt Library

Model Comparison

Analytics

Security

Add a final CTA.

5. Authentication

Implement real authentication.

Pages:

/login

/signup

/forgot-password

Support:

Email/password

Google authentication if provider is configured

After login, redirect to dashboard.

Protect authenticated routes.

Users must not be able to access another user’s prompts.

6. Main Application Layout

Create a persistent application shell.

Left Sidebar

Logo:

⚡ Prompt Forge

Navigation:

Dashboard

Forge

Optimize

Playground

Library

Templates

History

Analytics

Settings

Bottom:

User profile

Plan information

Theme switcher

Sidebar should collapse into icon-only mode.

On mobile, use an animated drawer.

7. Dashboard

Create a beautiful dashboard showing:

Header

“Good afternoon, [User Name]”

Subtitle:

“What will you forge today?”

Primary button:

+ New Prompt

Statistics

Cards:

Total Prompts

Prompts Optimized

Tests Run

Average Quality Score

Animate numbers when the dashboard loads.

Recent Prompts

Display cards containing:

Prompt title

Category

AI model

Quality score

Updated time

Favorite button

More menu

Quick Actions

Forge Prompt

Optimize Prompt

Test Prompt

Browse Templates

Activity

Show recent prompt activity.

8. Forge Workspace

This is the core feature.

Route:

/forge

Create a sophisticated two-panel workspace.

Left panel

Title:

What do you want AI to do?

Large textarea:

“Describe what you want your AI prompt to accomplish…”

Options:

Goal

General

Coding

Marketing

Research

Education

Data Analysis

Business

Content Creation

Image Generation

Productivity

Model

Dropdown:

GPT

Gemini

Claude

Custom

Prompt Style

Concise

Detailed

Expert

Creative

Structured

Chain-of-thought-safe reasoning

Button:

⚡ Forge Prompt

When clicked:

Validate input

Send request to backend

Show animated AI generation state

Stream response

Display generated prompt

Calculate quality score

Display improvement recommendations

9. Generated Prompt Panel

Display:

Generated Prompt

Use a beautiful code/editor-style container.

Features:

Copy

Edit

Regenerate

Save

Favorite

Export

Share

Improve

Show sections:

Role

Context

Objective

Instructions

Constraints

Output Format

Quality Criteria

The generated prompt should be structured and readable.

Add syntax highlighting or a polished editor experience.

10. Prompt Quality Score

Create an AI-powered scoring system.

Score:

92/100

Break it down into:

Clarity

Specificity

Context

Constraints

Output Definition

Robustness

Model Compatibility

Display a circular animated score indicator.

Example:

Prompt Quality

92
Excellent

Clarity       95
Specificity   91
Context       89
Structure     94
Robustness    90

Provide actionable suggestions.

11. Optimize Feature

Route:

/optimize

Allow the user to paste an existing prompt.

UI:

Paste Your Prompt

Then allow optimization modes:

Make clearer

Make more precise

Make shorter

Make more detailed

Improve reasoning

Improve consistency

Improve output formatting

Reduce ambiguity

Convert to professional prompt

Button:

Optimize Prompt

Show:

Original

and

Optimized

side by side.

Highlight changes.

Add:

Improvement: +18%

Allow users to accept or reject changes.

12. Playground

Route:

/playground

Create an interactive AI testing environment.

Layout:

Prompt

Large editable prompt area.

Variables

Allow variables such as:

{{topic}}

{{audience}}

{{tone}}

Create a variable editor.

Example:

Topic: Artificial Intelligence
Audience: College Students
Tone: Professional

Model Configuration

Model

Temperature

Max tokens

System instructions

Run

Button:

▶ Run Prompt

Show:

Response

Latency

Token usage

Estimated cost

Quality score

Allow multiple runs.

13. Model Comparison

Add a feature allowing the same prompt to run against multiple models.

Example:

Model

Response

Quality

Latency

GPT

Result

94

1.4s

Gemini

Result

91

1.1s

Claude

Result

93

1.7s

Make comparison cards visually excellent.

Add:

Compare Results

Highlight the best-performing result.

14. Prompt Library

Route:

/library

Users can save prompts.

Features:

Search

Filter

Sort

Favorites

Categories

Tags

Folders

Prompt cards should show:

Name

Preview

Category

Tags

Quality score

Model

Created date

Last updated

Favorite

More actions

Actions:

Open

Edit

Duplicate

Copy

Delete

Export

Move to folder

Implement real persistence.

15. Templates

Route:

/templates

Create professionally designed prompt templates.

Categories:

Software Development

Marketing

Business

Education

Research

Content Creation

Productivity

Data Science

Customer Support

Image Generation

Each template includes:

Title

Description

Example

Variables

Recommended model

Quality score

Button:

Use Template

This should open the Forge workspace with the template automatically loaded.

16. Prompt History

Route:

/history

Track prompt versions.

Display timeline:

Version 5
Today
Improved output structure

Version 4
Yesterday
Added constraints

Version 3
Yesterday
Improved clarity

Allow:

View version

Restore version

Compare versions

Delete version

Never permanently overwrite a prompt without creating a version.

17. Analytics

Route:

/analytics

Show:

Prompts created

Prompts optimized

Tests executed

Average quality

Most-used categories

Most-used models

Prompt success rate

Activity over time

Use clean charts.

Charts must be responsive.

18. Settings

Route:

/settings

Sections:

Profile

Name

Email

Avatar

AI Providers

Allow users to configure API keys securely.

Never expose API keys to the client.

Preferences

Theme

Default model

Default prompt style

Language

Security

Change password

Sessions

Logout

Data

Export prompts

Delete account

19. AI Backend

Create a proper AI service abstraction.

Do NOT hardcode the application to one AI provider.

Create an architecture similar to:

AIProvider
   |
   ├── OpenAIProvider
   ├── GeminiProvider
   └── AnthropicProvider

The frontend should call a unified API.

Example endpoints:

POST /api/forge
POST /api/optimize
POST /api/test
POST /api/compare
GET  /api/prompts
POST /api/prompts
PATCH /api/prompts/:id
DELETE /api/prompts/:id
GET  /api/history
GET  /api/analytics

Use environment variables for all API keys.

Provide .env.example.

Never expose secrets in frontend code.

20. Prompt Engineering Engine

The Forge engine should transform a basic user request into a structured prompt.

The system should intelligently determine:

Role

Context

Objective

Inputs

Instructions

Constraints

Tone

Output format

Evaluation criteria

Edge cases

The generated prompt should be optimized for the selected model.

Avoid generating unsafe or disallowed content.

21. Streaming AI

AI responses should stream progressively.

Do not wait for the entire response before displaying it.

Show:

Forging your prompt…

with animated status indicators:

Analyzing request
✓
Structuring instructions
✓
Optimizing constraints
●
Evaluating quality

Then reveal the result smoothly.

22. Command Palette

Add keyboard shortcut:

⌘ K

For Windows/Linux:

Ctrl K

Command palette options:

New Prompt

Search Prompts

Open Playground

Optimize Prompt

Templates

Settings

Toggle Theme

23. Keyboard Shortcuts

Implement:

⌘ K Command Palette

⌘ Enter Forge Prompt

⌘ S Save Prompt

⌘ Shift C Copy Prompt

Esc Close modal

Show shortcuts inside tooltips.

24. Notifications

Use toast notifications for:

Prompt saved

Prompt copied

Prompt deleted

Optimization completed

API error

Authentication error

Template loaded

Version restored

Never use browser alert().

25. Error Handling

Every API request must have proper:

Loading state

Success state

Error state

Retry option

Empty state

Example:

Something went wrong

“We couldn’t forge your prompt right now.”

Button:

Try Again

Do not allow the UI to crash because of API errors.

26. Responsive Design

The application must work perfectly on:

Desktop

Laptop

Tablet

Mobile

Desktop should use multi-panel layouts.

Mobile should intelligently stack panels.

Do not simply shrink desktop UI.

27. Accessibility

Implement:

Semantic HTML

Keyboard navigation

Focus states

ARIA labels

Accessible dialogs

Screen-reader-friendly controls

Sufficient contrast

Reduced-motion support

28. Performance

Optimize:

Server components where appropriate

Dynamic imports

Image optimization

API caching

Database queries

Streaming responses

Loading states

Avoid unnecessary client-side rendering.

29. Database Schema

Create persistent models for:

User
Prompt
PromptVersion
Folder
Template
PromptTest
Favorite
Activity
APIProvider

Relationships must ensure users can only access their own private data.

30. Demo Mode

If API keys are not configured, the application should still launch.

Create a clearly labeled:

Demo Mode

Use realistic mock AI responses so the UI can be tested without an API key.

However, once an API key is configured, the application must automatically use the real AI provider.

31. Seed Data

Create realistic sample data:

8+ prompts

6+ templates

Multiple categories

Different quality scores

Prompt history

Analytics data

Do not use lorem ipsum.

32. Premium Microinteractions

Add subtle interactions:

Button hover animations

Card hover elevation

Animated score rings

Smooth sidebar transitions

Animated modals

Skeleton loading

Text streaming

Gradient movement

Command palette transitions

Copy confirmation

Save animation

Favorite heart animation

Keep animations under control and professional.

33. Empty States

Every empty section should have a designed empty state.

Example:

Your Prompt Library is Empty

“Forge your first prompt and save it here.”

Button:

Create Your First Prompt

34. Security

Implement:

Authentication

Authorization

Input validation

Rate limiting where appropriate

Server-side API key handling

Environment variables

Database access control

XSS protection

CSRF-safe architecture

No secrets in client bundles

No API keys in Git

35. Project Structure

Use a clean architecture similar to:

app/
  (auth)/
  dashboard/
  forge/
  optimize/
  playground/
  library/
  templates/
  history/
  analytics/
  settings/
  api/

components/
  ui/
  layout/
  forge/
  playground/
  library/
  analytics/

lib/
  ai/
  db/
  auth/
  validation/
  utils/

hooks/

types/

prisma/

public/

Keep components modular.

Do not put the entire application into one giant component.

36. Final Quality Requirement

The result must feel like a real commercial SaaS product, not a student project or prototype.

Before finishing:

Run the application.

Check every route.

Check every button.

Check authentication.

Check database persistence.

Check API errors.

Check loading states.

Check mobile responsiveness.

Check dark/light mode.

Check keyboard shortcuts.

Check prompt creation.

Check optimization.

Check playground.

Check saving.

Check editing.

Check deleting.

Check version history.

Check templates.

Check analytics.

Fix all TypeScript/build/runtime errors.

Do not leave TODO buttons or fake functionality.

If a backend service cannot be configured immediately, implement a working mock/demo fallback rather than breaking the application.

Final Objective

When the project is complete, opening Prompt Forge AI should immediately communicate:

“This is a premium AI developer/productivity platform.”

The UI must be polished enough for a startup demo, portfolio showcase, hackathon presentation, or real SaaS launch.

Build the complete application end-to-end with working frontend + backend + database + AI integration + responsive premium UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b489ba3-4788-402a-a134-4ebc7e0760ef).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
