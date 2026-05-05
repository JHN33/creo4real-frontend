import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Flame,
  Target,
  Zap,
  Youtube,
  Instagram
} from 'lucide-react';
import { FaTiktok } from 'react-icons/fa';
import { Trophy } from "lucide-react";
import { Crown } from "lucide-react";
import { Users, Globe, TrendingUp, Radio } from "lucide-react";
import logo from './images/logo.jpg';
import coverphoto from './images/coverphoto.jpg';
import livestream from './images/livestream.jpg';
import flex from './images/flex.jpg';
import transformation from './images/transformation.jpg';
import journey1 from "./images/journey1.jpg";
import journey2 from "./images/journey2.jpg";
import journey3 from "./images/journey3.jpg";
import journey4 from "./images/journey4.jpg";
import journey5 from "./images/journey5.jpg";
import journey6 from "./images/journey6.jpg";
import journey7 from "./images/journey7.jpg";
import journey8 from "./images/journey8.jpg";
import journey9 from "./images/journey9.jpg";
import journey10 from "./images/journey10.jpg";
import DonationSection from "./DonationSection";


const API_URL = (import.meta.env.VITE_BACKEND_URL || "https://creo4real-backend.onrender.com").replace(/\/$/, "");

type VideoOfDay = {
  title: string;
  description: string;
  videoUrl: string;
  embedUrl: string;
  updatedAt?: string;
};

const isYouTubeEmbed = (url: string) => url.includes("youtube.com/embed/");

const getYouTubeEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    let videoId = "";

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.replace("/", "");
    } else if (parsed.searchParams.get("v")) {
      videoId = parsed.searchParams.get("v") || "";
    } else if (parsed.pathname.includes("/shorts/")) {
      videoId = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
    } else if (parsed.pathname.includes("/embed/")) {
      videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
};

function VideoOfTheDaySection() {
  const [video, setVideo] = useState<VideoOfDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_URL}/video-of-the-day`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (mounted && data?.videoUrl) setVideo(data);
      })
      .catch(() => {
        // Keep the homepage usable even if backend is asleep or unavailable.
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  if (loading) return null;

  return (
    <section id="video-of-day" className="py-20 px-6 bg-deep-black/60">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">
          VIDEO <span className="text-dragon-gold">OF THE DAY</span>
        </h2>
        <div className="w-24 h-1 bg-dragon-gold mx-auto mb-10"></div>

        {video?.videoUrl ? (
          <div className="rounded-sm border border-dragon-gold/30 bg-dragon-black/70 p-4 shadow-[0_0_35px_rgba(212,175,55,0.12)]">
            <div className="aspect-video overflow-hidden rounded-sm bg-black">
              {video.embedUrl && isYouTubeEmbed(video.embedUrl) ? (
                <iframe
                  src={video.embedUrl}
                  title={video.title || "Video of the day"}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={video.videoUrl}
                  title={video.title || "Video of the day"}
                  className="h-full w-full bg-black"
                  controls
                  playsInline
                />
              )}
            </div>
            <h3 className="mt-6 text-2xl font-bold text-dragon-gold">{video.title || "Today's Video"}</h3>
            {video.description && (
              <p className="mx-auto mt-3 max-w-3xl text-light-gold/80 leading-relaxed">{video.description}</p>
            )}
          </div>
        ) : (
          <div className="rounded-sm border border-dragon-gold/30 bg-dragon-black/70 p-8 text-light-gold/70">
            No video has been posted yet. Check back soon.
          </div>
        )}
      </div>
    </section>
  );
}

function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem("admin-token") || "");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/video-of-the-day`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data) return;
        setTitle(data.title || "");
        setDescription(data.description || "");
        setVideoUrl(data.videoUrl || "");
      })
      .catch(() => setMessage("Unable to load current video. The backend may be waking up."));
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("Checking login...");

    const response = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.token) {
      setMessage(data.message || "Login failed. Check your admin username and password.");
      return;
    }

    localStorage.setItem("admin-token", data.token);
    setToken(data.token);
    setPassword("");
    setMessage("Logged in successfully.");
  };

  const uploadVideoFile = async (file: File) => {
    if (!token) {
      setMessage("Please log in before uploading a video.");
      return;
    }

    if (!file.type.startsWith("video/")) {
      setMessage("Please choose a video file.");
      return;
    }

    setUploading(true);
    setMessage("Preparing secure Cloudinary upload...");

    try {
      const signatureResponse = await fetch(`${API_URL}/admin/cloudinary-signature`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const signatureData = await signatureResponse.json().catch(() => ({}));

      if (!signatureResponse.ok) {
        throw new Error(signatureData.message || "Could not prepare Cloudinary upload.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", String(signatureData.timestamp));
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);
      formData.append("public_id", signatureData.publicId);

      setMessage("Uploading video to Cloudinary...");

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json().catch(() => ({}));

      if (!uploadResponse.ok || !uploadData.secure_url) {
        throw new Error(uploadData.error?.message || "Cloudinary upload failed.");
      }

      const uploadedUrl = uploadData.secure_url;
      const uploadedTitle = title || file.name.replace(/\.[^/.]+$/, "");
      setVideoUrl(uploadedUrl);
      if (!title) setTitle(uploadedTitle);

      setMessage("Upload complete. Publishing Video of the Day...");
      const publishResponse = await fetch(`${API_URL}/admin/video-of-the-day`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: uploadedTitle, description, videoUrl: uploadedUrl }),
      });

      const publishData = await publishResponse.json().catch(() => ({}));
      if (!publishResponse.ok) {
        throw new Error(publishData.message || "Uploaded video, but could not publish it.");
      }

      setMessage("Video uploaded and published. Refresh the homepage to confirm it stays online.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Video upload failed.");
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const saveVideo = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving video...");

    const response = await fetch(`${API_URL}/admin/video-of-the-day`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, videoUrl }),
    });

    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setMessage(data.message || "Could not save video.");
      return;
    }

    setMessage("Video of the day updated successfully. Open the homepage to see it.");
  };

  const logout = () => {
    localStorage.removeItem("admin-token");
    setToken("");
    setMessage("Logged out.");
  };

  return (
    <div className="min-h-screen bg-dragon-black text-white">
      <nav className="border-b border-dragon-gold/20 bg-dragon-black/95 px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-wider text-dragon-gold">CREO4REAL Admin</a>
          <a href="/" className="rounded-sm border border-dragon-gold/40 px-4 py-2 text-sm font-bold text-light-gold transition-colors hover:bg-dragon-gold hover:text-deep-black">Back Home</a>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Admin Dashboard</h1>
        <p className="mb-8 text-light-gold/70">Log in to post or replace the Video of the Day.</p>

        {!token ? (
          <form onSubmit={login} className="space-y-5 rounded-sm border border-dragon-gold/30 bg-deep-black/70 p-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-dragon-gold">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-sm border border-dragon-gold/30 bg-black px-4 py-3 text-white outline-none focus:border-dragon-gold" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-dragon-gold">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-sm border border-dragon-gold/30 bg-black px-4 py-3 text-white outline-none focus:border-dragon-gold" />
            </div>
            <button className="w-full rounded-sm bg-dragon-gold px-5 py-3 font-bold text-deep-black hover:bg-light-gold">Log In</button>
          </form>
        ) : (
          <form onSubmit={saveVideo} className="space-y-5 rounded-sm border border-dragon-gold/30 bg-deep-black/70 p-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-dragon-gold">Video Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Daily Discipline Motivation" className="w-full rounded-sm border border-dragon-gold/30 bg-black px-4 py-3 text-white outline-none focus:border-dragon-gold" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-dragon-gold">Drag & Drop Video Upload</label>
              <div
                onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0];
                  if (file) uploadVideoFile(file);
                }}
                className={`rounded-sm border-2 border-dashed p-8 text-center transition-colors ${dragActive ? "border-dragon-gold bg-dragon-gold/10" : "border-dragon-gold/30 bg-black"}`}
              >
                <p className="font-bold text-dragon-gold">Drop your video here</p>
                <p className="mt-2 text-sm text-light-gold/60">or choose a video file from your computer</p>
                <label className="mt-5 inline-block cursor-pointer rounded-sm bg-dragon-gold px-5 py-3 font-bold text-deep-black hover:bg-light-gold">
                  {uploading ? "Uploading..." : "Choose Video"}
                  <input
                    type="file"
                    accept="video/*"
                    disabled={uploading}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadVideoFile(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="mt-2 text-sm text-light-gold/50">Uploaded videos publish automatically. You can still paste a URL and click Save Video.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-dragon-gold">Video URL</label>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Upload a video or paste a YouTube / Cloudinary URL" className="w-full rounded-sm border border-dragon-gold/30 bg-black px-4 py-3 text-white outline-none focus:border-dragon-gold" />
              <p className="mt-2 text-sm text-light-gold/50">YouTube links, Shorts links, embed links, and Cloudinary video links are supported.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-dragon-gold">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Write a short message about today&apos;s video..." className="w-full rounded-sm border border-dragon-gold/30 bg-black px-4 py-3 text-white outline-none focus:border-dragon-gold" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button disabled={saving || uploading} className="flex-1 rounded-sm bg-dragon-gold px-5 py-3 font-bold text-deep-black hover:bg-light-gold disabled:opacity-50">{saving ? "Saving..." : uploading ? "Uploading..." : "Save Video"}</button>
              <button type="button" onClick={logout} className="rounded-sm border border-dragon-gold/40 px-5 py-3 font-bold text-light-gold hover:bg-dragon-gold hover:text-deep-black">Log Out</button>
            </div>
          </form>
        )}

        {message && <p className="mt-6 rounded-sm border border-dragon-gold/20 bg-black/40 p-4 text-light-gold/80">{message}</p>}

       
      </main>
      <CookieBanner />
    </div>
  );
}


function CookieBanner() {
  const [choice, setChoice] = useState(() => localStorage.getItem("cookie-consent") || "");

  if (choice) return null;

  const saveChoice = (value: "accepted" | "rejected") => {
    localStorage.setItem("cookie-consent", value);
    setChoice(value);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-[120] mx-auto max-w-4xl rounded-sm border border-dragon-gold/40 bg-deep-black p-5 shadow-[0_0_30px_rgba(212,175,55,0.2)] md:flex md:items-center md:justify-between md:gap-6">
      <p className="mb-4 text-sm leading-relaxed text-light-gold/80 md:mb-0">
        This website uses cookies to improve your experience, analyze traffic, and support advertising. You can accept or reject non-essential cookies.
      </p>
      <div className="flex flex-shrink-0 gap-3">
        <button
          type="button"
          onClick={() => saveChoice("rejected")}
          className="rounded-sm border border-dragon-gold/40 px-4 py-2 text-sm font-bold text-light-gold transition-colors hover:bg-dragon-gold/10"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => saveChoice("accepted")}
          className="rounded-sm bg-dragon-gold px-4 py-2 text-sm font-bold text-deep-black transition-colors hover:bg-light-gold"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedResultImage, setSelectedResultImage] = useState<{ image: string; label: string } | null>(null);

  const merchandise = [
    {
      id: 1,
      name: 'DAILY LIVESTREAM INSPIRATION',
      image: livestream,
      link: 'https://www.tiktok.com/@creo4real',
    },
    {
      id: 2,
      name: 'FOLLOW MY SELF TRANSFORMATION',
      image: flex,
      link: 'https://www.instagram.com/creo4real/',
    },
    {
      id: 3,
      name: 'MY STORY UNFOLDED',
      image: transformation,
      link: 'https://www.youtube.com/@creo4real',
    },
    
  ];

  const journeyImages = [
  journey1,
  journey2,
  journey3,
  journey4,
  journey5,
  journey6,
  journey7,
  journey8,
  journey9,
  journey10,
  
];


const resultBoxes = Array.from({ length: 22 }, (_, index) => ({
  id: index + 1,
  image: `/real-results/result-${String(index + 1).padStart(2, "0")}.jpg`,
  label: `Real result ${index + 1}`,
}));


const legalPages: Record<string, { title: string; subtitle: string; content: string[] }> = {
  "/about": {
    title: "About CREO4REAL",
    subtitle: "A movement built on discipline, consistency, and real transformation.",
    content: [
      "CREO4REAL was created to inspire people who are serious about improving their physical, mental, and personal growth. This platform shares real transformation content, daily motivation, and practical encouragement for anyone working to become a stronger version of themselves.",
      "Our mission is to show that change is possible when discipline, responsibility, and consistency are applied every day. The real results shown on this website represent effort, progress, and commitment over time.",
      "This website also provides a way for visitors to support the platform through optional contributions. These contributions help maintain the project, improve the website, and continue producing motivational content for the community.",
      "Whether you are starting your own journey or looking for motivation to continue, CREO4REAL exists to remind you that you have the power to create your own reality."
    ],
  },
  "/privacy": {
    title: "Privacy Policy",
    subtitle: "How we collect, use, and protect visitor information.",
    content: [
      "We value your privacy and aim to be transparent about how this website uses information. When you visit this website, we may collect basic technical information such as browser type, device information, pages visited, and general usage data.",
      "This information may be used to improve website performance, understand visitor behavior, measure traffic, and provide a better user experience. If advertising or analytics services are enabled, third-party providers such as Google AdSense or Google Analytics may use cookies or similar technologies in accordance with their own privacy policies.",
      "Cookies may be used to remember preferences, analyze traffic, and support advertising. Visitors may accept or reject non-essential cookies using the cookie notice on this website. You can also disable cookies through your browser settings.",
      "We do not sell personal information. We may only share limited information with trusted third-party services when necessary for analytics, advertising, payment processing, security, or website functionality.",
      "If you have privacy questions, contact us at creo4real@gmail.com."
    ],
  },
  "/terms": {
    title: "Terms of Service",
    subtitle: "The rules for using this website.",
    content: [
      "By accessing and using this website, you agree to use it responsibly and lawfully. The content provided here is for general informational, motivational, and educational purposes only.",
      "Transformation results can vary from person to person. We do not guarantee specific fitness, lifestyle, financial, or personal outcomes based on the content shown on this website.",
      "Any donations, contributions, or payments made through this website are voluntary unless clearly stated otherwise. Digital payment and crypto transactions should be checked carefully before completion, including the correct amount, currency, address, and network.",
      "This website may contain links to third-party platforms such as social media, payment providers, analytics tools, or advertising networks. We are not responsible for the policies, content, or actions of third-party websites.",
      "We may update these terms from time to time. Continued use of the website means you accept the updated terms."
    ],
  },
  "/contact": {
    title: "Contact",
    subtitle: "Questions, feedback, and support.",
    content: [
      "For questions, feedback, partnership requests, or support, contact us by email.",
      "Email: creo4real@gmail.com",
      "We aim to respond as soon as possible."
    ],
  },
};




useEffect(() => {
  const interval = setInterval(() => {
    setCurrentIndex((prev) =>
      prev === journeyImages.length - 1 ? 0 : prev + 1
    );
  }, 3000); // 3 seconds

  return () => clearInterval(interval);
}, [journeyImages.length]);

const [currentIndex, setCurrentIndex] = useState(0);

const nextSlide = () => {
  setCurrentIndex((prev) =>
    prev === journeyImages.length - 1 ? 0 : prev + 1
  );
};

const prevSlide = () => {
  setCurrentIndex((prev) =>
    prev === 0 ? journeyImages.length - 1 : prev - 1
  );
};

const activePage = legalPages[window.location.pathname];

if (window.location.pathname === "/admin") {
  return <AdminPage />;
}

if (activePage) {
  return (
    <div className="min-h-screen bg-dragon-black text-white">
      <nav className="border-b border-dragon-gold/20 bg-dragon-black/95 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-wider text-dragon-gold">CREO4REAL</a>
          <a href="/" className="rounded-sm border border-dragon-gold/40 px-4 py-2 text-sm font-bold text-light-gold transition-colors hover:bg-dragon-gold hover:text-deep-black">Back Home</a>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-4 text-4xl font-bold md:text-6xl">{activePage.title}</h1>
        <p className="mb-8 text-xl text-dragon-gold">{activePage.subtitle}</p>
        <div className="space-y-6 text-lg leading-relaxed text-light-gold/80">
          {activePage.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </main>

      <footer className="border-t border-dragon-gold/20 px-6 py-8 text-center text-sm text-light-gold/50">
        <div className="mb-4 flex flex-wrap justify-center gap-6">
          <a href="/about" className="hover:text-dragon-gold">About</a>
          <a href="/privacy" className="hover:text-dragon-gold">Privacy Policy</a>
          <a href="/terms" className="hover:text-dragon-gold">Terms</a>
          <a href="/contact" className="hover:text-dragon-gold">Contact</a>
          <a href="/admin" className="hover:text-dragon-gold">Admin</a>
        </div>
        <p>2026 CREO4REAL. CREATE YOUR REALITY.</p>
      </footer>
      <CookieBanner />
    </div>
  );
}
  return (
    <div className="min-h-screen bg-dragon-black text-white">

      {/* NAV */}
      <nav className="fixed w-full bg-dragon-black/95 backdrop-blur-sm z-50 border-b border-dragon-gold/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold tracking-wider text-dragon-gold">
                CREO4REAL
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-light-gold hover:text-dragon-gold transition-colors">Home</a>
             <a href="#about" className="text-light-gold hover:text-dragon-gold transition-colors">About</a>
             <a href="#discover" className="text-light-gold hover:text-dragon-gold transition-colors"> Discover</a>
              <a href="#video-of-day" className="text-light-gold hover:text-dragon-gold transition-colors">Video</a>
              <a href="#philosophy" className="text-light-gold hover:text-dragon-gold transition-colors">Mantra</a>
              <a href="#merch" className="text-light-gold hover:text-dragon-gold transition-colors">Join Us</a>
              <a
  href="#donation"
  className="bg-dragon-gold text-deep-black px-6 py-2 rounded-sm hover:bg-light-gold transition-colors font-semibold inline-block"
>
  DONATE
</a>
            </div>

            <button
              className="md:hidden text-dragon-gold"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>



        {/* MOBILE MENU */}
{mobileMenuOpen && (
  <div className="md:hidden bg-dragon-black border-t border-dragon-gold/20 px-6 pb-6 space-y-4">

    <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block text-light-gold hover:text-dragon-gold">
      Home
    </a>

    <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-light-gold hover:text-dragon-gold">
      About
    </a>

    <a href="#discover" onClick={() => setMobileMenuOpen(false)} className="block text-light-gold hover:text-dragon-gold">
      Discover
    </a>

    <a href="#video-of-day" onClick={() => setMobileMenuOpen(false)} className="block text-light-gold hover:text-dragon-gold">
      Video of the Day
    </a>

    <a href="#philosophy" onClick={() => setMobileMenuOpen(false)} className="block text-light-gold hover:text-dragon-gold">
      Mantra
    </a>

    <a href="#merch" onClick={() => setMobileMenuOpen(false)} className="block text-light-gold hover:text-dragon-gold">
      Join Us
    </a>

    <a
      href="#donation"
      onClick={() => setMobileMenuOpen(false)}
      className="block bg-dragon-gold text-deep-black px-4 py-2 rounded-sm font-semibold text-center"
    >
      Donate
    </a>

  </div>
)}
      </nav>

      {/* HERO */}
      <section id="home" className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">

          <div className="flex justify-center mb-8">
            <img
              src={logo}
              alt="Logo"
              className="w-32 h-32 object-contain animate-float drop-shadow-[0_0_12px_rgba(212,175,55,0.5)] rounded-xl"
            />
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
            CREATE YOUR
            <span className="block text-dragon-gold mt-2">OWN REALITY</span>
          </h1>

          <p className="text-xl md:text-2xl text-light-gold/80 mb-12 leading-relaxed">
            Discipline. Growth. Freedom. Reality
          </p>

          <br></br>


          <h3 className="text-2xl md:text-3xl font-bold text-dragon-gold mb-8 tracking-wide">
  JOIN A GROWING MOVEMENT
</h3>

<div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">

  <div className="flex flex-col items-center space-y-2">
    <Users className="w-8 h-8 text-dragon-gold" />
    <p className="text-lg font-bold text-light-gold">2,000+</p>
    <p className="text-sm text-light-gold/70">Followers</p>
  </div>

  <div className="flex flex-col items-center space-y-2">
    <Radio className="w-8 h-8 text-dragon-gold" />
    <p className="text-lg font-bold text-light-gold">Daily</p>
    <p className="text-sm text-light-gold/70">Livestreams</p>
  </div>

  <div className="flex flex-col items-center space-y-2">
    <TrendingUp className="w-8 h-8 text-dragon-gold" />
    <p className="text-lg font-bold text-light-gold">Real</p>
    <p className="text-sm text-light-gold/70">Transformation</p>
  </div>

  <div className="flex flex-col items-center space-y-2">
    <Globe className="w-8 h-8 text-dragon-gold" />
    <p className="text-lg font-bold text-light-gold">Global</p>
    <p className="text-sm text-light-gold/70">Community</p>
  </div>

</div>
        </div>
      </section>





      <section id="about" className="py-20 px-6 bg-deep-black/50">

     
                <div className="max-w-6xl mx-auto text-center">

                 <h2 className="text-5xl md:text-6xl font-bold mb-6">
                    ABOUT <span className="text-dragon-gold">CREO4REAL</span>
                 </h2>

                <div className="w-24 h-1 bg-dragon-gold mx-auto mb-10"></div>

               <p className="text-xl text-light-gold/80 leading-relaxed max-w-3xl mx-auto mb-8">
                CREO4REAL is more than just a lifestyle brand. It is a movement for people ready to level up their lives.

                Whether you want to transform your body, start a business, grow your confidence or build a new future, it starts with one decision.

                Take action today.
              </p>

              <p className="text-xl text-light-gold/80 leading-relaxed max-w-3xl mx-auto mb-8">
              CREO4REAL is built on one core belief: You have the power to create your own reality.
              Through discipline, responsibility, and relentless consistency, you shape the life you live.
              </p>

              <p className="text-lg text-light-gold/70 leading-relaxed max-w-3xl mx-auto">
    
              We don’t wait for change. We become it. Every day is an opportunity to evolve,
              to push limits, and to become stronger mentally and physically.
             </p>

           </div>

           <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">


                  <a
                    href="#merch"
                      className="px-8 py-3 bg-dragon-gold text-deep-black font-bold hover:bg-light-gold transition-all rounded-sm"
                  >
                  JOIN THE MOVEMENT
                  </a>

                  <a
                     href="#donation"
                      className="px-8 py-3 border border-dragon-gold text-dragon-gold font-bold hover:bg-dragon-gold hover:text-deep-black transition-all rounded-sm"
                  >
                   SUPPORT THE MISSION
                  </a>

            </div>
    </section>



    <section id="discover" className="py-20 px-6 bg-deep-black/50">
         <div className="max-w-6xl mx-auto text-center">

         <h2 className="text-5xl md:text-6xl font-bold mb-6">
            MY <span className="text-dragon-gold">JOURNEY</span>
          </h2>

         <div className="w-24 h-1 bg-dragon-gold mx-auto mb-10"></div>

          <p className="text-xl text-light-gold/80 leading-relaxed max-w-3xl mx-auto mb-8">
               I moved to the UK alone with nothing but a backpack and the decision to survive. 
               No money, no support, no English, and no clear path — only pressure, uncertainty, and the choice to either break or rebuild. 
               Life tested me in every way, but I refused to stay down. Step by step, I chose discipline over excuses, growth over fear, and responsibility over giving up. 
               That is how I started building myself from zero.
          </p>

          <p className="text-xl text-light-gold/80 leading-relaxed max-w-3xl mx-auto mb-12">
             Today, I inspire more than 2,000 people who follow this mission and we are only getting started.
          </p>

           <p className="text-xl text-light-gold/80 leading-relaxed max-w-3xl mx-auto mb-12">
           My journey is still real. I live with serious injuries, including my back and knee, and some days the fight is physical as much as mental. 
           As I seek better medical treatment to fix this problem, I refuse to break. Pain doesn't stop me. 
           I keep showing up, keep working, keep growing, and keep inspiring others through my example. 
           CREO4REAL was born from that mindset — to help people who feel lost, broken, or stuck believe in themselves again. 
           If you would like to support my recovery and help this mission grow, your support would mean more than you know.
           </p>




           <div className="flex justify-center mb-10">
  <a
    href="https://www.gofundme.com/f/help-me-get-the-treatment-i-need-fxxrc?attribution_id=sl:08268eda-da3b-41cc-9bfd-987d713ece36&lang=en_GB&ts=1776987655&utm_campaign=man_sharesheet_dash&utm_content=amp20_t1&utm_medium=customer&utm_source=copy_link"
    target="_blank"
    rel="noopener noreferrer"
    className="px-8 py-3 bg-dragon-gold text-deep-black font-bold hover:bg-light-gold transition-all rounded-sm"
  >
    GO-FUND-ME
  </a>
</div>

           

    {/* CAROUSEL */}
    <div className="relative max-w-3xl mx-auto">

      <div className="relative overflow-hidden rounded-sm border border-dragon-gold/20">

  {/* TRACK */}
  <div
    className="flex transition-transform duration-700 ease-in-out"
    style={{
      transform: `translateX(-${currentIndex * 100}%)`,
    }}
  >

    {journeyImages.map((img, index) => (
      <div key={index} className="w-full flex-shrink-0">

        {/* RESPONSIVE FRAME */}
        <div className="aspect-[4/5] md:h-[900px] w-full overflow-hidden">

          <img
            src={img}
            alt={`journey-${index}`}
            className="w-full h-full object-cover object-center"
          />

        </div>

      </div>
    ))}

  </div>

</div>

      {/* LEFT BUTTON */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-3 -translate-y-1/2 bg-dragon-gold text-black px-3 py-1 rounded-sm font-bold"
      >
        ‹
      </button>

      {/* RIGHT BUTTON */}
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-3 -translate-y-1/2 bg-dragon-gold text-black px-3 py-1 rounded-sm font-bold"
      >
        ›
      </button>

    </div>

  </div>
</section>





      {/* CORE SECTION */}
<section className="py-20 px-6 bg-deep-black/50">

  <div className="max-w-7xl mx-auto text-center mb-16">

    <h2 className="text-5xl md:text-6xl font-bold mb-6">
      CREO4REAL <span className="text-dragon-gold"> CODE</span>
    </h2>

    <div className="w-24 h-1 bg-dragon-gold mx-auto"></div>

  </div>

  <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-8">

    <div className="text-center p-8 border border-dragon-gold/20 hover:border-dragon-gold/60 transition-all">
      <Flame className="w-12 h-12 text-dragon-gold mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-3 text-dragon-gold">Create</h3>
      <p className="text-light-gold/70">
        Use the spark from the fire within yourself to create your reality. Every journey begins with a single decision to change.
      </p>
    </div>

    <div className="text-center p-8 border border-dragon-gold/20 hover:border-dragon-gold/60 transition-all">
        <Trophy className="w-12 h-12 text-dragon-gold mx-auto mb-4" />

        <h3 className="text-2xl font-bold mb-3 text-dragon-gold">
            Discipline
        </h3>

        <p className="text-light-gold/70">
            Discipline builds freedom.
            Small daily wins create massive change. Actions over excuses. Stop waiting for the right time.
       </p>
    </div>

    <div className="text-center p-8 border border-dragon-gold/20 hover:border-dragon-gold/60 transition-all">
      <Target className="w-12 h-12 text-dragon-gold mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-3 text-dragon-gold">Focus</h3>
      <p className="text-light-gold/70">
        Channel your energy with precision. Be responsible and execute daily. Never forget masters are made through disciplined action.
      </p>
    </div>

    <div className="text-center p-8 border border-dragon-gold/20 hover:border-dragon-gold/60 transition-all">
      <Zap className="w-12 h-12 text-dragon-gold mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-3 text-dragon-gold">Transform</h3>
      <p className="text-light-gold/70">
        Rise from the ashes. Become the strongest version of yourself through discipline and consistency.
      </p>
    </div>

    <div className="text-center p-8 border border-dragon-gold/20 hover:border-dragon-gold/60 transition-all">
       <Crown className="w-12 h-12 text-dragon-gold mx-auto mb-4" />

       <h3 className="text-2xl font-bold mb-3 text-dragon-gold">
       Standards
       </h3>

       <p className="text-light-gold/70">
       Become who you respect. Build yourself with standards.
       </p>
    </div>

  </div>
</section>

      {/* PHILOSOPHY */}
      <section id="philosophy" className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            THE <span className="text-dragon-gold">CREO4REAL</span> MANTRA
          </h2>
          <div className="w-24 h-1 bg-dragon-gold mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">

          <div className="space-y-6 text-left">

            <div className="border-l-4 border-dragon-gold pl-6">
              <h3 className="text-2xl font-bold mb-3 text-dragon-gold">Strength Through Adversity</h3>
              <p className="text-light-gold/80 leading-relaxed">
                Just like the dragon don't fear the storm, become one with it. Every rep, every challenge, every moment of doubt is an opportunity to forge unbreakable resolve.
              </p>
            </div>

            <div className="border-l-4 border-dragon-gold pl-6">
              <h3 className="text-2xl font-bold mb-3 text-dragon-gold">Mind Over Matter</h3>
              <p className="text-light-gold/80 leading-relaxed">
                Physical transformation begins in the mind. Master your thoughts, and your body will follow. Discipline is the bridge between goals and achievement.
              </p>
            </div>

            <div className="border-l-4 border-dragon-gold pl-6">
              <h3 className="text-2xl font-bold mb-3 text-dragon-gold">Rise Daily</h3>
              <p className="text-light-gold/80 leading-relaxed">
                Greatness isn't built in a day, it's built daily. Show up when motivation fades. Consistency is the mark of great achievers.
              </p>
            </div>

          </div>

          <div className="w-full max-w-[420px] aspect-square bg-gradient-to-br from-dragon-gold/20 to-transparent rounded-sm overflow-hidden p-1 mx-auto">
            <img
              src={coverphoto}
              alt="Cover"
              className="w-full h-full object-cover scale-105"
            />
          </div>

        </div>
      </section>

      <VideoOfTheDaySection />

      {/* MERCH */}
      <section id="merch" className="py-20 px-6 bg-deep-black/50">
        <div className="max-w-7xl mx-auto text-center mb-16">

          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            LET'S GROW <span className="text-dragon-gold">TOGETHER</span>
          </h2>

          <p className="text-xl text-light-gold/70 max-w-2xl mx-auto">
            Join a community built on discipline, consistency, and real transformation.
            Get daily live-stream motivation, accountability, and positive energy as you transform your life with a focused mindset, growth and action.
          </p> 

        <br></br>
          <p className="text-xl text-light-gold/70 max-w-2xl mx-auto"> 
            Stay up to date with daily sessions and updates where we push limits, stay consistent, and grow stronger together. No excuses, just results !

          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

          {merchandise.map((item) => (
            <div key={item.id} className="border border-dragon-gold/20 hover:border-dragon-gold transition-all overflow-hidden">

              <div className="aspect-square overflow-hidden">
                <img src={item.image} className="w-full h-full object-cover" />
              </div>

              <div className="p-6 text-center">

                <h3 className="text-xl font-bold mb-4 text-light-gold">
                  {item.name}
                </h3>

                <a
                  href={item.link}
                  className="inline-block px-5 py-2 bg-dragon-gold text-deep-black font-bold hover:bg-light-gold transition-all rounded-sm"
                >
                  DISCOVER
                </a>

              </div>

            </div>
          ))}

        </div>
      </section>



{/* REAL RESULTS */}
<section id="testimonials" className="py-20 px-6 bg-deep-black overflow-hidden">
  <div className="max-w-7xl mx-auto text-center mb-16">

    <h2 className="text-5xl md:text-6xl font-bold mb-6">
      REAL <span className="text-dragon-gold">RESULTS</span>
    </h2>

    <div className="w-24 h-1 bg-dragon-gold mx-auto mb-10"></div>

    <p className="text-xl text-light-gold/70 max-w-2xl mx-auto">
     Real people. Real inspiration. Real results. <br></br>
      Watch inspiration  <span className="text-dragon-gold"> spark </span> real change.
    </p>

  </div>

  <div className="relative w-full overflow-hidden">
    <div className="real-results-marquee flex gap-6 w-max">
      {[...resultBoxes, ...resultBoxes].map((result, index) => (
        <button
          key={`${result.id}-${index}`}
          type="button"
          onClick={() => setSelectedResultImage({ image: result.image, label: result.label })}
          title={`Open ${result.label}`}
          className="group relative block w-64 md:w-72 h-96 flex-shrink-0 border border-dragon-gold/30 bg-deep-black/80 rounded-sm overflow-hidden shadow-[0_0_24px_rgba(212,175,55,0.08)] focus:outline-none focus:ring-2 focus:ring-dragon-gold"
        >
          <img
            src={result.image}
            alt={result.label}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(event) => {
              const target = event.currentTarget;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-deep-black/80 px-3 py-2 text-center text-xs font-bold uppercase tracking-widest text-dragon-gold opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
            Click to read.
          </div>
          <div className="hidden w-full h-full items-center justify-center text-center p-6">
            <div>
              <p className="text-dragon-gold text-4xl font-bold mb-3">
                {String(result.id).padStart(2, "0")}
              </p>
              <p className="text-light-gold/70 font-bold">
               
              </p>
              <p className="text-light-gold/40 text-sm mt-2">
                public/real-results/result-{String(result.id).padStart(2, "0")}.jpg
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
</section>

{selectedResultImage && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-black/95 px-4 py-8"
    role="dialog"
    aria-modal="true"
    aria-label={selectedResultImage.label}
    onClick={() => setSelectedResultImage(null)}
  >
    <button
      type="button"
      onClick={() => setSelectedResultImage(null)}
      className="absolute right-5 top-5 rounded-full border border-dragon-gold/50 bg-dragon-black/80 p-3 text-dragon-gold transition-colors hover:bg-dragon-gold hover:text-deep-black focus:outline-none focus:ring-2 focus:ring-dragon-gold"
      aria-label="Close image viewer"
    >
      <X className="h-6 w-6" />
    </button>

    <div
      className="max-h-[90vh] max-w-5xl overflow-auto rounded-sm border border-dragon-gold/40 bg-dragon-black p-3 shadow-[0_0_40px_rgba(212,175,55,0.18)]"
      onClick={(event) => event.stopPropagation()}
    >
      <img
        src={selectedResultImage.image}
        alt={selectedResultImage.label}
        className="h-auto max-h-none w-full max-w-none object-contain md:max-h-[84vh] md:max-w-[90vw]"
      />

    </div>
  </div>
)}





      {/* DONATION */}
      <DonationSection />

      {/* FOOTER (FULL RESTORED) */}
      <footer className="bg-deep-black border-t border-dragon-gold/20 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">

            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold tracking-wider text-dragon-gold">
                CREO4REAL
              </span>
            </div>

            <div className="flex max-w-full flex-wrap justify-center gap-x-6 gap-y-3 text-center text-sm sm:text-base">
                           <a href="#home" className="text-light-gold/60 hover:text-dragon-gold transition-colors">
                             Home
                           </a>

                           <a href="#about" className="text-light-gold/60 hover:text-dragon-gold transition-colors">
                             About
                           </a>

                          <a href="#discover" className="text-light-gold/60 hover:text-dragon-gold transition-colors">
                            Discover
                          </a>

                          <a href="#philosophy" className="text-light-gold/60 hover:text-dragon-gold transition-colors">
                            Mantra
                          </a>

                           <a href="#merch" className="text-light-gold/60 hover:text-dragon-gold transition-colors">
                            Join Us
                           </a>

                           <a href="/privacy" className="text-light-gold/60 hover:text-dragon-gold transition-colors">
                            Privacy
                           </a>

                           <a href="/terms" className="text-light-gold/60 hover:text-dragon-gold transition-colors">
                            Terms
                           </a>

                           <a href="/contact" className="text-light-gold/60 hover:text-dragon-gold transition-colors">
                            Contact
                           </a>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              <a href="https://www.youtube.com/@creo4real" className="group">
                <Youtube className="w-6 h-6 text-light-gold/60 group-hover:text-red-500 transition-all duration-300 group-hover:scale-125" />
              </a>

              <a href="https://www.instagram.com/creo4real/" className="group">
                <Instagram className="w-6 h-6 text-light-gold/60 group-hover:text-pink-500 transition-all duration-300 group-hover:scale-125" />
              </a>

              <a href="https://www.tiktok.com/@creo4real" className="group">
                <FaTiktok className="w-6 h-6 text-light-gold/60 group-hover:text-cyan-400 transition-all duration-300 group-hover:scale-125" />
              </a>
            </div>

          </div>

          <div className="text-center mt-8 text-light-gold/40 text-sm">
            <p>2026 CREO4REAL. CREATE YOUR REALITY.</p>
          </div>
        </div>
      </footer>
      <CookieBanner />

    </div>
  );
}

export default App;