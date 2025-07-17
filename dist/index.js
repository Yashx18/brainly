"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = 3000;
app.get("/api/vi/sign-up", (req, res) => {
    console.log("It's Working !!");
});
app.get("/api/vi/sign-in", (req, res) => {
    console.log("It's Working !!");
});
app.get("/api/vi/content", (req, res) => {
    console.log("It's Working !!");
});
app.get("/api/vi/brain/share", (req, res) => {
    console.log("It's Working !!");
});
app.listen(PORT, () => {
    console.log(`Server is running at 'http://localhost:${PORT}'`);
});
