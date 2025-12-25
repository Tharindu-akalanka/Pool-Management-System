# AI-Driven Team Guide

**Since we are using the AI Agent to write code, follow these simple rules.**

## 1. How to Work
Don't worry about files or code syntax. Just describe what you want.

*   **Bad Prompt**: "Create a function called handleLogin in src/pages/Login.jsx using useEffect."
*   **Good Prompt**: "Create a Login page. It should have an email and password field. When I click Login, it should take me to the Dashboard."

## 2. Before You Start (Every Day)
Always start your session by asking the AI to get the latest changes.
> **Prompt**: "Please check for new updates from the team and download them."

## 3. Saving Your Work
When you finish a feature, ask the AI to save it.
> **Prompt**: "I'm done with the Profile page. Please save my changes to GitHub so the team can see them."

## 4. Specific Rules for Our Team
1.  **Don't work on the same thing**: If Member #2 is doing "Login", Member #3 should do "Dashboard". If you touch the same files, the AI might get confused merging them.
2.  **Test often**: Since the AI writes the code, you must *look* at the app to make sure it works.
    *   *Prompt*: "Run the app so I can see it."
3.  **If it breaks**:
    *   *Prompt*: "The app is showing a blank white screen. Please fix it."

## 5. Setup (First Time Only)
1.  **Clone**: Ask the AI: "Clone the repository [URL] for me."
2.  **Install**: Ask the AI: "Install all the libraries we need."
