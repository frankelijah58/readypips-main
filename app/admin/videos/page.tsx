"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  Video,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface VideoItem {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  category: string;
  duration?: string;
  createdAt: string;
}

const CATEGORIES = [
  "Forex Basics",
  "Technical Analysis",
  "Risk Management",
  "Trading Psychology",
  "Advanced Strategies",
  "Platform Tutorials",
];

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    thumbnail: "",
    category: "",
    duration: "",
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (data?.videos) {
        setVideos(data.videos);
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url || !form.category) {
      toast.error("Title, URL, and category are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data?.success) {
        toast.success("Video added successfully");
        setShowForm(false);
        setForm({ title: "", description: "", url: "", thumbnail: "", category: "", duration: "" });
        fetchVideos();
      } else {
        toast.error(data?.error || "Failed to add video");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await fetch(`/api/videos?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data?.success) {
        toast.success("Video deleted");
        fetchVideos();
      } else {
        toast.error(data?.error || "Failed to delete video");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete video");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Video Management</h1>
          <p className="text-white/60 text-sm mt-1">Manage academy videos</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </>
          )}
        </Button>
      </div>

      {/* Add Video Form */}
      {showForm && (
        <Card className="mb-6 bg-[#2F3349] border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Add New Video</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Video title"
                    className="bg-[#18181b] border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Category *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger className="bg-[#18181b] border-white/10 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Video URL *</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                  className="bg-[#18181b] border-white/10 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Thumbnail URL</Label>
                  <Input
                    value={form.thumbnail}
                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                    placeholder="https://example.com/thumb.jpg"
                    className="bg-[#18181b] border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Duration</Label>
                  <Input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 10:30"
                    className="bg-[#18181b] border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Video description..."
                  className="bg-[#18181b] border-white/10 text-white min-h-[100px]"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Video
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-white/50 mx-auto" />
        </div>
      ) : videos.length === 0 ? (
        <Card className="bg-[#2F3349] border-white/10">
          <CardContent className="py-20 text-center">
            <Video className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No videos yet. Click "Add Video" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {videos.map((video) => (
            <Card
              key={video._id}
              className="bg-[#2F3349] border-white/10 hover:border-white/20 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-20 bg-[#18181b] rounded-lg overflow-hidden flex-shrink-0">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-semibold truncate">{video.title}</h3>
                        <p className="text-white/50 text-sm mt-1 line-clamp-2">{video.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">
                            {video.category}
                          </span>
                          {video.duration && (
                            <span className="text-xs text-white/40">{video.duration}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(video._id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}