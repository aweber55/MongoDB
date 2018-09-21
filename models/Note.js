var mongoose = require("mongoose");

var Schema = mongoose.Schema;


var NoteSchema = new Schema({


    body: {
        type: String
    },
    name: {
        type: String
    }
    // title: {
    //     type: String
    // },
    // body: {
    //     type: String,
    //     required: true
    // }
});

var Note = mongoose.model("Note", NoteSchema);

module.exports = Note;