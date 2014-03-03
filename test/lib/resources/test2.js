

function goodbye(name, cb) {
    "use strict";
    process.nextTick(function() {
        cb(null, "Goodbye " + name);
    });
}

goodbye.params = ["name"];

function getInfo(info, cb) {
    "use strict";
    var retVal = null;
    var err    = null;

    switch(info) {
        case "hobbies":
            retVal = ["skiing", "swimming", "running", "reading"];
            break;

        case "personal":
            retVal = { age: "42", status: "married" };
            break;

        default:
            err = {message: "Invalid request: " + info};
            break;
    }

    cb(err, retVal);
}

getInfo.params = ["info"];

module.exports.goodbye = goodbye;
module.exports.getInfo = getInfo;