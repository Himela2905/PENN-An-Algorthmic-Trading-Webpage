from fyers_apiv3 import fyersModel 
# Initialize the fyersModel instance (just a test, don't worry about valid credentials yet)
session = fyersModel.SessionModel(
    client_id="TEST_ID",
    secret_key="TEST_SECRET",
    redirect_uri="https://localhost",
    response_type="code"
)

print("Success! The library is working perfectly.")