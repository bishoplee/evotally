const cors = require("cors");
app.use(cors({
  origin: ["https://app.yourdomain.com"], // your Nuxt URL
  methods: ["POST","GET","OPTIONS"],
  allowedHeaders: ["Authorization","Content-Type"]
}));

