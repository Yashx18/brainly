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
exports.JWTsecret = void 0;
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const db_2 = require("./db");
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("./middleware");
exports.JWTsecret = "kenx18";
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.post("/api/vi/sign-up", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    try {
        yield db_1.UserModel.create({
            username,
            password,
        });
        res.json({
            message: "Sign up successful",
        });
    }
    catch (e) {
        res.status(401).json({
            message: "Username already taken.",
        });
    }
}));
app.post("/api/vi/sign-in", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const existingUser = yield db_1.UserModel.findOne({
        username,
        password,
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            id: existingUser._id,
        }, exports.JWTsecret);
        res.json({
            token: token,
        });
    }
    else {
        res.json({
            message: "Invalid credentials.",
        });
    }
}));
app.post("/api/vi/content", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = req.body.link;
    const type = req.body.type;
    yield db_2.ContentModel.create({
        link,
        type,
        title: req.body.title,
        // @ts-ignore
        userId: req.userId,
        tags: [],
    });
    res.json({
        message: "Content added",
    });
}));
app.get("/api/vi/content", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const content = yield db_2.ContentModel.find({
        userId: userId,
    }).populate("userId", "username");
    res.json({
        content,
    });
}));
app.delete("/api/vi/content", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.body.contentId;
    yield db_2.ContentModel.deleteMany({
        contentId,
        // @ts-ignore
        userId: req.userId,
    });
    res.json({
        message: "Deleted",
    });
}));
app.post("/api/vi/brain/share", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    if (share) {
        const user = yield db_1.UserModel.findOne({
            // @ts-ignore
            _id: req.userId
        });
        // const hast = randomHash(10)
    }
}));
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
