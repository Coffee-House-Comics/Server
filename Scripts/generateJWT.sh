# TAKEN FROM https://stackoverflow.com/a/59003757
# ---------------------------------------------------------------------------------------------------------------
# Construct the header
jwt_header=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 | sed s/\+/-/g | sed 's/\//_/g' | sed -E s/=+$//)

# ans: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

# Construct the payload
payload=$(echo -n '{"email":"coffeehousecomics416@gmail.com"}' | base64 | sed s/\+/-/g |sed 's/\//_/g' |  sed -E s/=+$//)

# ans: eyJlbWFpbCI6ImpvcmRhbkBleGFtcGxlLmNvbSJ9

# Store the raw user secret (with example of newline at end)
secret=$'INSERTRAWSECRET\n'

# Note, because the secret may have newline, need to reference using form $"" 
echo -n "$secret"

# Convert secret to hex (not base64)
hexsecret=$(echo -n "$secret" | xxd -p | paste -sd "")

# ans: 62696773656372657469737665727968617264746f67756573736279736e65616b7970656f706c6572696768740a

# For debug, also display secret in base64 (for input into https://jwt.io/)
echo -n "$secret" | base64

# ans: Ymlnc2VjcmV0aXN2ZXJ5aGFyZHRvZ3Vlc3NieXNuZWFreXBlb3BsZXJpZ2h0Cg==

# Calculate hmac signature -- note option to pass in the key as hex bytes
hmac_signature=$(echo -n "${jwt_header}.${payload}" |  openssl dgst -sha256 -mac HMAC -macopt hexkey:$hexsecret -binary | base64  | sed s/\+/-/g | sed 's/\//_/g' | sed -E s/=+$//)

# Create the full token
jwt="${jwt_header}.${payload}.${hmac_signature}"

echo ":::::"

echo -n $jwt