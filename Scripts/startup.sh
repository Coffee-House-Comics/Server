echo \"Starting app.js...\"
echo \"Running shutdown first to make sure no server is running already... \"
bash ./Scripts/shutdown.sh
echo \"Done with shutdown, starting now... \"
node index.js > output.log 2>&1 &
echo \"Finished index.js\"
echo \"Some information about the process:\"
lsof -i tcp:3000
echo \"DONE\"