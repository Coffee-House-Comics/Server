echo \"Stopping the server...\"
pid=$(lsof -i:3000 -t); kill -TERM $pid || kill -KILL $pid
echo \"Clear content of log file\"
cat /dev/null > output.log
echo \"DONE\"