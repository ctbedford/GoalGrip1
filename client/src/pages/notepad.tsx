import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { FileText, Save, Trash2, ArrowLeft, Plus, Download, CheckCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const Notepad: React.FC = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem('goalSyncNotes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaved, setIsSaved] = useState(true);

  // Save notes to localStorage whenever the notes array changes
  useEffect(() => {
    localStorage.setItem('goalSyncNotes', JSON.stringify(notes));
  }, [notes]);

  // Auto-save functionality
  useEffect(() => {
    if (activeNote && (!isSaved && (title !== activeNote.title || content !== activeNote.content))) {
      const autoSaveTimer = setTimeout(() => {
        handleSaveNote();
      }, 2000);
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [title, content, activeNote, isSaved]);

  const createNewNote = () => {
    // Prompt to save any unsaved changes
    if (activeNote && !isSaved) {
      if (window.confirm("You have unsaved changes. Would you like to save them before creating a new note?")) {
        handleSaveNote();
      }
    }
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Reflection",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setTitle(newNote.title);
    setContent(newNote.content);
    setIsSaved(false);
  };

  const handleNoteClick = (note: Note) => {
    // Prompt to save any unsaved changes
    if (activeNote && !isSaved) {
      if (window.confirm("You have unsaved changes. Would you like to save them before switching notes?")) {
        handleSaveNote();
      }
    }
    
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsSaved(true);
  };

  const handleDeleteNote = (noteId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this reflection? This action cannot be undone.");
    if (confirmDelete) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      
      // If the deleted note was the active note, clear the editor
      if (activeNote && activeNote.id === noteId) {
        setActiveNote(null);
        setTitle("");
        setContent("");
      }
      
      toast({
        title: "Reflection deleted",
        description: "Your reflection has been successfully deleted.",
        variant: "default"
      });
    }
  };

  const handleSaveNote = () => {
    if (!activeNote) return;
    
    const updatedNotes = notes.map(note => {
      if (note.id === activeNote.id) {
        return {
          ...note,
          title,
          content,
          updatedAt: new Date()
        };
      }
      return note;
    });
    
    setNotes(updatedNotes);
    setActiveNote({
      ...activeNote,
      title,
      content,
      updatedAt: new Date()
    });
    setIsSaved(true);
    
    toast({
      title: "Reflection saved",
      description: "Your reflections have been saved successfully.",
      variant: "default"
    });
  };

  const handleExportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `goalsync-reflections-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export successful",
      description: "Your reflections have been exported successfully.",
      variant: "default"
    });
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-800 bg-gray-900 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-3 h-8 w-8 text-gray-400 hover:text-gray-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-lg text-gray-100 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-emerald-400" />
                Reflection Notepad
              </h1>
              <p className="text-xs text-gray-400">Capture your thoughts and insights on your goal journey</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeNote && !isSaved && (
              <span className="text-xs text-amber-400 flex items-center mr-2">
                <Timer className="h-3 w-3 mr-1 animate-pulse" />
                Auto-saving...
              </span>
            )}
            {activeNote && isSaved && (
              <span className="text-xs text-emerald-400 flex items-center mr-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Saved
              </span>
            )}
            <Button onClick={createNewNote} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3">
              <Plus className="h-4 w-4 mr-1" />
              New Note
            </Button>
            <Button onClick={handleExportNotes} size="sm" variant="outline" className="h-8 px-3 border-emerald-800 text-emerald-300 hover:bg-emerald-900/30">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex">
        {/* Notes List Sidebar */}
        <div className="w-72 border-r border-gray-800 bg-gray-900 overflow-y-auto">
          <div className="p-4">
            <Input
              type="search"
              placeholder="Search reflections..."
              className="bg-gray-950 border-gray-800 focus:border-emerald-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Separator className="bg-gray-800" />
          <div className="p-2">
            {filteredNotes.length > 0 ? (
              <div className="space-y-2">
                {filteredNotes.map((note) => (
                  <Card 
                    key={note.id} 
                    className={`hover:bg-gray-800 cursor-pointer transition-colors ${
                      activeNote && activeNote.id === note.id 
                        ? 'border-emerald-700 bg-gray-800' 
                        : 'border-gray-800 bg-gray-900'
                    }`}
                    onClick={() => handleNoteClick(note)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-2">
                          <h3 className="font-medium text-sm text-gray-200 line-clamp-1">{note.title}</h3>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-2">{formatDate(note.updatedAt)}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notes found</p>
                {searchQuery ? (
                  <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
                ) : (
                  <Button 
                    variant="link" 
                    className="text-emerald-400 mt-2 text-xs"
                    onClick={createNewNote}
                  >
                    Create your first reflection
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeNote ? (
            <>
              <div className="p-4 bg-gray-900 border-b border-gray-800">
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsSaved(false);
                  }}
                  placeholder="Note title"
                  className="text-lg font-medium bg-transparent border-gray-800 focus:border-emerald-700"
                />
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <Textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setIsSaved(false);
                  }}
                  placeholder="What insights or reflections do you have about your goal journey today?"
                  className="w-full h-full min-h-[300px] resize-none bg-transparent border-gray-800 focus:border-emerald-700"
                />
              </div>
              <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Last updated: {formatDate(activeNote.updatedAt)}
                </div>
                <Button 
                  onClick={handleSaveNote}
                  size="sm"
                  disabled={isSaved}
                  className={`${
                    isSaved 
                      ? 'bg-gray-700 text-gray-300 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-72 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-center text-gray-300">No Note Selected</CardTitle>
                  <CardDescription className="text-center text-gray-500">
                    Select a note from the sidebar or create a new one to get started.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                  <Button 
                    onClick={createNewNote}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create New Note
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notepad;