require("./routes");
const db = require("./db/db");


// set port, listen for requests
app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});
