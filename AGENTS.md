# Copilot Instructions

## General Behavior
- Follow project architecture strictly
- Prefer clean, maintainable, modular code
- Do not overcomplicate solutions

## UI Guidelines
- UI must match existing NebulaRoute design system
- Use glassmorphism, blur, and soft shadows consistently
- Keep animations subtle and smooth
- Ensure full mobile responsiveness

## Code Quality
- Avoid Math.random(); use crypto.getRandomValues() for randomness
- No inline hacks or temporary fixes unless explicitly requested
- Keep functions small and reusable

## Security Rules
- Firebase rules must enforce user-based access control
- Never store sensitive data in plain text
- Always validate authentication before data access

## Architecture Rules
- Use modular route system: window.NebulaRouteModules
- Each route must export a render() function
- Keep UI and logic separated

## Database
- Choose Firestore or RTDB based on feature needs:
  - Firestore for structured scalable data
  - RTDB for real-time sync features

## UI Components
- Use custom modals instead of alert() or confirm()
- Ensure UI components match site styling