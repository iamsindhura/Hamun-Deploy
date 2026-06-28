"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const STICKER_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😊",
    stickers: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "worried", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"]
  },
  {
    name: "Emotions",
    icon: "❤️",
    stickers: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]
  },
  {
    name: "Nature",
    icon: "🌸",
    stickers: ["🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🍄", "🌰", "🦀", "🦞", "🦐", "🦑", "🌍", "🌎", "🌏", "🌐", "🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "🌙", "🌚", "🌛", "🌜", "☀️", "🌝", "🌞", "⭐", "🌟", "🌠", "☁️", "⛅", "⛈️", "🌤️", "🌥️", "🌦️", "🌧️", "🌨️", "🌩️", "🌪️", "🌫️", "🌬️", "🌀", "🌈", "🌂", "☂️", "☔", "⛱️", "⚡", "❄️", "☃️", "⛄", "☄️", "🔥", "💧", "🌊"]
  },
  {
    name: "Productivity",
    icon: "🚀",
    stickers: ["🚀", "🎯", "⚡", "💡", "🧠", "📈", "📊", "✅", "☑️", "✔️", "📌", "📍", "📎", "🖇️", "📏", "📐", "✂️", "🖊️", "🖋️", "✒️", "🖌️", "🖍️", "📝", "✏️", "🔍", "🔎", "🗂️", "📂", "📁", "📋", "📅", "📆", "📇", "🗒️", "🗓️", "🗃️", "🗄️", "🗑️", "🔒", "🔓", "🔏", "🔐", "🔑", "🗝️"]
  },
  {
    name: "Study",
    icon: "📚",
    stickers: ["📚", "📖", "📗", "📘", "📙", "📚", "📓", "📒", "📃", "📜", "📄", "📰", "🗞️", "📑", "🔖", "🎓", "🎒", "🏫", "🕰️", "⌛", "⏳", "⏰", "⏱️", "⏲️", "🕰️", "👓", "🕶️", "🥽", "🔬", "🔭", "📡"]
  },
  {
    name: "Work",
    icon: "💼",
    stickers: ["💼", "💻", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🧯", "🗑️", "🛢️", "💸", "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎"]
  },
  {
    name: "Symbols",
    icon: "⭐",
    stickers: ["⭐", "🌟", "✨", "💫", "💥", "💢", "💦", "💨", "🕳️", "💣", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "骨", "👀", "👁️", "👅", "👄", "💋", "🩸"]
  },
  {
    name: "Celebration",
    icon: "🎉",
    stickers: ["🎉", "🎊", "🎈", "🎂", "🧁", "🎁", "🎀", "🧨", "🎇", "🎆", "🥂", "🍻", "🍾", "🏆", "🏅", "🥇", "🥈", "🥉", "🎖️", "🎫", "🎟️"]
  },
  {
    name: "Motivation",
    icon: "🔥",
    stickers: ["🔥", "💪", "💯", "🚀", "⭐", "🌟", "✨", "🎯", "🏆", "👑", "🧗", "🏃", "🧘", "🧗‍♂️", "🧗‍♀️", "🏋️", "🏋️‍♂️", "🏋️‍♀️", "🚵", "🚵‍♂️", "🚵‍♀️"]
  },
  {
    name: "Lifestyle",
    icon: "☕",
    stickers: ["☕", "🍵", "🥤", "🧋", "🧃", "🧉", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🍾", "🧊", "🥄", "🍴", "🍽️", "🥣", "🥡", "🥢", "🧂", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥗", "🍿", "🧈", "🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥗", "🍿", "🧈", "🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓"]
  }
];

const LOCAL_STORAGE_RECENTS_KEY = "tiptap_sticker_recents";
const LOCAL_STORAGE_FAVORITES_KEY = "tiptap_sticker_favorites";

interface StickerPickerProps {
  onSelect: (sticker: string) => void;
  onClose?: () => void;
}

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Smileys");
  const [recents, setRecents] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const storedRecents = localStorage.getItem(LOCAL_STORAGE_RECENTS_KEY);
      if (storedRecents) setRecents(JSON.parse(storedRecents));
      
      const storedFavorites = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    } catch (e) {
      console.error("Failed to load stickers from local storage", e);
    }
  }, []);

  const handleSelect = (sticker: string) => {
    // Update recents
    const newRecents = [sticker, ...recents.filter(s => s !== sticker)].slice(0, 10);
    setRecents(newRecents);
    localStorage.setItem(LOCAL_STORAGE_RECENTS_KEY, JSON.stringify(newRecents));
    
    onSelect(sticker);
    if (onClose) onClose();
  };

  const toggleFavorite = (e: React.MouseEvent, sticker: string) => {
    e.stopPropagation();
    e.preventDefault();
    let newFavorites;
    if (favorites.includes(sticker)) {
      newFavorites = favorites.filter(s => s !== sticker);
    } else {
      newFavorites = [sticker, ...favorites];
    }
    setFavorites(newFavorites);
    localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const filteredStickers = useMemo(() => {
    if (!search.trim()) return [];
    const lowerSearch = search.toLowerCase();
    
    // Quick, generic search matching category names
    let results: string[] = [];
    for (const category of STICKER_CATEGORIES) {
      if (category.name.toLowerCase().includes(lowerSearch)) {
        results = [...results, ...category.stickers];
      }
    }
    
    // Also include a few hardcoded keywords for popular searches
    if ("heart".includes(lowerSearch) || "love".includes(lowerSearch)) {
      results = [...results, "❤️", "💖", "💕", "❣️", "💘"];
    }
    if ("study".includes(lowerSearch)) {
      results = [...results, "📚", "✏️", "📝", "📓", "🎓"];
    }
    
    return Array.from(new Set(results));
  }, [search]);

  return (
    <div className="w-[320px] bg-white rounded-xl shadow-lg border border-border flex flex-col overflow-hidden text-sm">
      <div className="p-3 border-b border-border bg-gray-50/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stickers..." 
            className="pl-8 h-9 text-sm bg-white"
            autoFocus
          />
        </div>
      </div>
      
      {!search.trim() && (
        <div className="flex px-2 py-1.5 border-b border-border gap-1 overflow-x-auto hide-scrollbar bg-gray-50/30">
          {STICKER_CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "px-2 py-1.5 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 transition-colors shrink-0",
                activeCategory === cat.name ? "bg-gray-100 shadow-sm" : "opacity-60 hover:opacity-100"
              )}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 h-[280px] overflow-y-auto custom-scrollbar">
        {search.trim() ? (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Search Results</h4>
            {filteredStickers.length > 0 ? (
              <div className="grid grid-cols-6 gap-1">
                {filteredStickers.map((sticker, i) => (
                  <StickerButton 
                    key={i} 
                    sticker={sticker} 
                    isFavorite={favorites.includes(sticker)}
                    onSelect={handleSelect} 
                    onToggleFavorite={toggleFavorite} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No stickers found.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.length > 0 && activeCategory === STICKER_CATEGORIES[0].name && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Favorites
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {favorites.map((sticker, i) => (
                    <StickerButton 
                      key={i} 
                      sticker={sticker} 
                      isFavorite={true}
                      onSelect={handleSelect} 
                      onToggleFavorite={toggleFavorite} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {recents.length > 0 && activeCategory === STICKER_CATEGORIES[0].name && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> Recent
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {recents.map((sticker, i) => (
                    <StickerButton 
                      key={i} 
                      sticker={sticker} 
                      isFavorite={favorites.includes(sticker)}
                      onSelect={handleSelect} 
                      onToggleFavorite={toggleFavorite} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {STICKER_CATEGORIES.map(category => (
              <div 
                key={category.name} 
                className={activeCategory === category.name ? "block" : "hidden"}
              >
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1 uppercase tracking-wider">
                  {category.name}
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {category.stickers.map((sticker, i) => (
                    <StickerButton 
                      key={`${category.name}-${i}`} 
                      sticker={sticker} 
                      isFavorite={favorites.includes(sticker)}
                      onSelect={handleSelect} 
                      onToggleFavorite={toggleFavorite} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StickerButton({ 
  sticker, 
  isFavorite, 
  onSelect, 
  onToggleFavorite 
}: { 
  sticker: string; 
  isFavorite: boolean; 
  onSelect: (s: string) => void;
  onToggleFavorite: (e: React.MouseEvent, s: string) => void;
}) {
  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(sticker)}
        className="w-full aspect-square text-2xl flex items-center justify-center hover:bg-muted rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
      >
        {sticker}
      </button>
      <button 
        onClick={(e) => onToggleFavorite(e, sticker)}
        className={cn(
          "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center border border-border opacity-0 group-hover:opacity-100 transition-opacity z-10",
          isFavorite && "opacity-100"
        )}
      >
        <Star className={cn("w-2.5 h-2.5 text-gray-400", isFavorite && "fill-amber-400 text-amber-400")} />
      </button>
    </div>
  );
}
