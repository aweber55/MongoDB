var mongoose = require("mongoose");

var Schema = mongoose.Schema;


var NoteSchema = new Schema({


    body: {
        type: String
    },
    name: {
        type: String
    },
    articleId: {
        type:Schema.Types.ObjectId,
    }
    //     ref:"article"
    // }
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