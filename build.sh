#!/bin/bash
set -e

git pull origin main
git reset --hard origin/main
npm ci
npm run build
npm prune --omit=dev
pm2 reload smart-bazar --update-env
