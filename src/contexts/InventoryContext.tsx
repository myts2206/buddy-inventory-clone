
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

interface InventoryContextType {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (item: InventoryItem) => void;
  deleteItem: (id: string) => void;
  categories: string[];
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  tags: string[];
  addTag: (tag: string) => void;
  deleteTag: (tag: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedItems = localStorage.getItem('inventoryItems');
    const savedCategories = localStorage.getItem('inventoryCategories');
    const savedTags = localStorage.getItem('inventoryTags');

    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedTags) setTags(JSON.parse(savedTags));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('inventoryItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('inventoryCategories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('inventoryTags', JSON.stringify(tags));
  }, [tags]);

  const addItem = (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setItems([...items, newItem]);
    
    // Auto-add new category and tags if they don't exist
    if (!categories.includes(item.category)) {
      addCategory(item.category);
    }
    
    item.tags.forEach(tag => {
      if (!tags.includes(tag)) {
        addTag(tag);
      }
    });
  };

  const updateItem = (updatedItem: InventoryItem) => {
    setItems(
      items.map((item) =>
        item.id === updatedItem.id
          ? { ...updatedItem, updatedAt: new Date() }
          : item
      )
    );
    
    // Auto-add new category and tags if they don't exist
    if (!categories.includes(updatedItem.category)) {
      addCategory(updatedItem.category);
    }
    
    updatedItem.tags.forEach(tag => {
      if (!tags.includes(tag)) {
        addTag(tag);
      }
    });
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
    }
  };

  const deleteCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
    // Move items in this category to "Uncategorized"
    setItems(
      items.map((item) =>
        item.category === category
          ? { ...item, category: 'Uncategorized', updatedAt: new Date() }
          : item
      )
    );
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const deleteTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    // Remove this tag from all items
    setItems(
      items.map((item) => ({
        ...item,
        tags: item.tags.filter((t) => t !== tag),
        updatedAt: new Date(),
      }))
    );
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        categories,
        addCategory,
        deleteCategory,
        tags,
        addTag,
        deleteTag,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
