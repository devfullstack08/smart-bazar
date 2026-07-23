#!/bin/bash
set -e

git pull origin main
git reset --hard origin/main
npm ci
rm -rf .next

npm run build
npm prune --omit=dev
pm2 reload smart-bazar --update-env
pm2 save
