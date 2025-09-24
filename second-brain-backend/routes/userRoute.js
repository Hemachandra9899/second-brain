import { Router } from 'express';
import Note from '../models/noteModel.js';

const route = Router();

// GET all notes or search notes by title/description
route.get('/note', async (req, res) => {
    try {
        const { query } = req.query;
        let notes;
        if (query) {
            // search in title or description
            notes = await Note.find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            });
        } else {
            notes = await Note.find();
        }
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST new note
route.post('/note', async (req, res) => {
    try {
        const { title, description } = req.body;
        const newNote = new Note({
            title,
            description
        });

        await newNote.save();
        res.status(201).json({ message: "Note saved successfully", note: newNote });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE a note by id
route.delete('/note/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNote = await Note.findByIdAndDelete(id);
        if (!deletedNote) return res.status(404).json({ message: "Note not found" });
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE a note by id
route.put('/note/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        const updatedNote = await Note.findByIdAndUpdate(
            id,
            { title, description },
            { new: true, runValidators: true } // returns the updated document
        );

        if (!updatedNote) return res.status(404).json({ message: "Note not found" });

        res.json({ message: "Note updated successfully", note: updatedNote });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default route;
