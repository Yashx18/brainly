"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.post("/api/vi/sign-up", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    yield db_1.UserModel.create({
        username,
        password,
    });
    res.json({
        message: "Sign up successful",
    });
}));
app.get("/api/vi/sign-in", (req, res) => {
    console.log("It's Working !!");
});
app.get("/api/vi/content", (req, res) => {
    console.log("It's Working !!");
});
app.get("/api/vi/brain/share", (req, res) => {
    console.log("It's Working !!");
});
function connectdb() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect("mongodb+srv://Ken:93549387YH@cluster0.rrelns0.mongodb.net/Brainly");
        console.log("DB Connnected");
    });
}
connectdb();
app.listen(PORT, () => {
    console.log(`Server is running at 'http://localhost:${PORT}'`);
});
