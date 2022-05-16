echo \"Starting app.js...\"
echo \"Running shutdown first to make sure no server is running already... \"
bash ./Scripts/shutdown.sh
echo \"Done with shutdown, starting now... \"
pm2 start ecosystem.config.js --time
echo \"Finished index.js\"
echo \"DONE\"