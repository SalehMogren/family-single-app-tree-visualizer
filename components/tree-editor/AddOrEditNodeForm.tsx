import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FamilyMember } from "../../lib/types";
import { useTranslation } from "../../lib/i18n/useTranslation";

interface AddOrEditNodeFormProps {
  nodeToEdit?: FamilyMember | null;
  relationType?: "parent" | "spouse" | "child" | "sibling" | null;
  onSave: (data: Partial<FamilyMember>) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export const AddOrEditNodeForm: React.FC<AddOrEditNodeFormProps> = ({
  nodeToEdit,
  relationType,
  onSave,
  onCancel,
  isDarkMode,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<FamilyMember>>({});

  useEffect(() => {
    setFormData(
      nodeToEdit
        ? { ...nodeToEdit }
        : {
            gender: "male",
            birth_year: 1980,
          }
    );
  }, [nodeToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FamilyMember, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const title = nodeToEdit
    ? t('forms.editMemberInfo')
    : `${t('forms.add')} ${
        relationType === "parent"
          ? t('relationships.parent')
          : relationType === "spouse"
          ? t('relationships.spouse')
          : relationType === "sibling"
          ? t('relationships.sibling')
          : t('relationships.child')
      }`;

  return (
    <Card
      className={`p-4 ${
        isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50"
      }`}>
      <form onSubmit={handleSubmit}>
        <div className='flex items-center justify-between mb-4'>
          <h3
            className={`font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
            {title}
          </h3>
          <Button variant='ghost' size='sm' type='button' onClick={onCancel}>
            ✕
          </Button>
        </div>
        <div className='space-y-3'>
          <div>
            <Label htmlFor='name'>{t('forms.name')}</Label>
            <Input
              id='name'
              name='name'
              value={formData.name || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label htmlFor='gender'>{t('forms.gender')}</Label>
              <Select
                name='gender'
                value={formData.gender || "male"}
                onValueChange={(v) => handleSelectChange("gender", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='male'>{t('forms.male')}</SelectItem>
                  <SelectItem value='female'>{t('forms.female')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='birth_year'>{t('forms.birthYear')}</Label>
              <Input
                id='birth_year'
                name='birth_year'
                type='number'
                value={formData.birth_year || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div>
            <Label htmlFor='death_year'>{t('forms.deathYear')} ({t('forms.optional')})</Label>
            <Input
              id='death_year'
              name='death_year'
              type='number'
              value={formData.death_year || ""}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor='occupation'>{t('forms.occupation')} ({t('forms.optional')})</Label>
            <Input
              id='occupation'
              name='occupation'
              value={formData.occupation || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className='flex gap-2 pt-2'>
            <Button type='submit' size='sm' className='flex-1'>
              {t('common.save')}
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='flex-1'
              onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};
