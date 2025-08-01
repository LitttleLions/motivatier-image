# Active Context

## Current Work Focus
The focus is to finalize the project configuration for a simplified, manual deployment workflow using Plesk's "Git" and "Docker" extensions. The Nginx reverse proxy for subdirectory access has been successfully configured, and static file serving issues have been addressed.

## Recent Changes
- The deployment strategy has been simplified to a manual, two-click process in Plesk, abandoning the automated webhook approach.
- The workflow is now: 1. Push to GitHub. 2. Use Plesk's Git extension to pull changes. 3. Use Plesk's Docker extension to rebuild the container.
- The `docker-compose.yml`, `webhook.py`, and `deployment/deploy.sh` files were removed.
- The `Dockerfile` has been optimized for production (multi-stage build, unprivileged user).
- The `templates/index.html` was updated to use relative paths for static assets, resolving MIME type and loading issues.
- A local `push_to_github.sh` script was created to streamline the Git push process.
- The Nginx reverse proxy on Plesk has been successfully configured for subdirectory access (`/motivatier-image`) using a fixed port (`32777`).

## Next Steps
- Update `memory-bank/progress.md` and `memory-bank/plan_plesk.md` to reflect the latest changes and successful fixes.

## Active Decisions and Considerations
- The "Stacks" (Docker Compose) feature in Plesk will not be used, as the application is a single container and the direct "Rebuild" functionality in the Docker extension is simpler.
- All container configuration (volumes, environment variables, port mapping) is managed directly through the Plesk Docker UI.
- Nginx configuration for subdirectory proxying now uses a fixed port (`32777`) for the Docker container.

## Learnings and Project Insights
- User constraints (like lack of SSH access) are critical and can significantly simplify the required technical solution.
- Plesk's built-in Git and Docker extensions provide a viable, albeit manual, workflow for users without command-line access.
- Correct relative paths in HTML are crucial for applications deployed in subdirectories.
- Using fixed ports for Docker containers in Plesk simplifies Nginx reverse proxy configuration.
