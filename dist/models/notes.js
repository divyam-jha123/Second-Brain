import { Schema, model } from "mongoose";
const noteSchema = new Schema({
    title: {
        type: Schema.Types.ObjectId,
        required: [true, "title is required"],
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
}, { timestamps: true });
const noteModel = model('Notes', noteSchema);
export default noteModel;
//# sourceMappingURL=notes.js.map