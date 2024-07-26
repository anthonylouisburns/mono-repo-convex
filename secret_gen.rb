require "jwt"
# https://medium.com/identity-beyond-borders/how-to-configure-sign-in-with-apple-77c61e336003
key_file = "apple_private_key.pk"
team_id = "2754562DVA"
client_id = "com.everwhz.service"
key_id = "5327AZB24G"
validity_period = 180 # In days. Max 180 (6 months) according to Apple docs.

private_key = OpenSSL::PKey::EC.new IO.read key_file

token = JWT.encode(
	{
		iss: team_id,
		iat: Time.now.to_i,
		exp: Time.now.to_i + 86400 * validity_period,
		aud: "https://appleid.apple.com",
		sub: client_id
	},
	private_key,
	"ES256",
	header_fields=
	{
		kid: key_id 
	}
)
puts token