
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useInventory } from "@/contexts/InventoryContext";
import { InventoryItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/TagInput";
import { DialogFooter } from "@/components/ui/dialog";

export function AddItemForm({ onSuccess }: { onSuccess?: () => void }) {
  const { addItem, categories } = useInventory();
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    quantity: number;
    category: string;
    description: string;
    tags: string[];
  }>({
    name: "",
    quantity: 1,
    category: categories.length > 0 ? categories[0] : "",
    description: "",
    tags: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 0 : value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all required fields are filled before submission
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Item name is required",
        variant: "destructive",
      });
      return;
    }

    // Since this is where the error occurs, ensure all required fields are provided
    // The issue is that the form data passed to addItem has optional properties
    // but the type definition requires them to be non-optional
    addItem({
      name: formData.name,
      quantity: formData.quantity,
      category: formData.category,
      description: formData.description,
      tags: formData.tags,
    });

    toast({
      title: "Success",
      description: "Item added successfully",
    });

    // Reset form
    setFormData({
      name: "",
      quantity: 1,
      category: categories.length > 0 ? categories[0] : "",
      description: "",
      tags: [],
    });

    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Item name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          value={formData.quantity}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        {categories.length > 0 ? (
          <Select
            value={formData.category}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Enter a category"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Item description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput
          tags={formData.tags}
          onTagsChange={handleTagsChange}
          placeholder="Add tags..."
          maxTags={10}
        />
      </div>

      <DialogFooter>
        <Button type="submit">Add Item</Button>
      </DialogFooter>
    </form>
  );
}
