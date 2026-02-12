import { useState } from "react";
import { useOrg } from "@/context/OrgContext";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Label from "@/components/form/Label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrgDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { createOrganization } = useOrg();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createOrganization(name, description || undefined);
      toast({ title: "Workspace created" });
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Could not create workspace",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)}>
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Create workspace</h2>
          <p className="text-sm text-gray-500">Add a new workspace to organize your projects.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Name</Label>
            <Input id="orgName" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgDesc">Description (optional)</Label>
            <Textarea id="orgDesc" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
