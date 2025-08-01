# Active Context

## Current Work Focus
The focus is to finalize the project configuration for a simplified, manual deployment workflow using Plesk's "Git" and "Docker" extensions, as the user does not have SSH access.

## Recent Changes
- The deployment strategy has been simplified to a manual, two-click process in Plesk, abandoning the automated webhook approach.
- The workflow is now: 1. Push to GitHub. 2. Use Plesk's Git extension to pull changes. 3. Use Plesk's Docker extension to rebuild the container.
- The `docker-compose.yml` is no longer the primary deployment method; configuration will be managed directly in the Plesk Docker UI.

## Next Steps
- Remove the now-unnecessary files for the automated workflow (`docker-compose.yml`, `webhook.py`, `deployment/deploy.sh`).
- Provide the user with a final, clear set of instructions for the manual deployment process.
- Update `memory-bank/progress.md` and `memory-bank/plan_plesk.md` to reflect this new, simplified strategy.

## Active Decisions and Considerations
- The "Stacks" (Docker Compose) feature in Plesk will not be used, as the application is a single container and the direct "Rebuild" functionality in the Docker extension is simpler.
- All container configuration (volumes, environment variables, port mapping) will be managed directly through the Plesk Docker UI.

## Learnings and Project Insights
- User constraints (like lack of SSH access) are critical and can significantly simplify the required technical solution.
- Plesk's built-in Git and Docker extensions provide a viable, albeit manual, workflow for users without command-line access.
