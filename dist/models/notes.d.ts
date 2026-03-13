import { Document } from "mongoose";
interface Inote extends Document {
    title: Object;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const noteModel: import("mongoose").Model<Inote, {}, {}, {}, Document<unknown, {}, Inote, {}, import("mongoose").DefaultSchemaOptions> & Inote & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, Inote>;
export default noteModel;
//# sourceMappingURL=notes.d.ts.map