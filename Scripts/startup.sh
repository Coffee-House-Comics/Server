echo \"Starting app.js...\"
echo \" Running shutdown first to make sure no server is running already... \"
bash shutdown.sh
echo \" Done with shutdown, starting now... \"
node index.js > output.log 2>&1 &
echo \"Finished app.js\"
echo \"DONE\"