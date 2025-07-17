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
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
    let processedValue: any = value;
    
    // If it's the birth_year field and value looks like a date, extract the year
    if (name === 'birth_year' && typeof value === 'string' && value.includes('-')) {
      const year = parseInt(value.split('-')[0], 10);
      if (!isNaN(year)) {
        processedValue = year;
      }
    } else if (name === 'birth_year' && value !== '') {
      processedValue = parseInt(value, 10);
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = (name: keyof FamilyMember, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = t('validation.nameRequired');
    }
    
    if (!formData.birth_year) {
      newErrors.birth_year = t('validation.birthYearRequired');
    }
    
    setErrors(newErrors);
    
    // If there are no errors, submit the form
    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
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
              data-testid='name-input'
              value={formData.name || ""}
              onChange={handleInputChange}
              required
            />
            {errors.name && (
              <span data-testid='name-error' className='text-red-500 text-sm mt-1 block'>
                {errors.name}
              </span>
            )}
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label htmlFor='gender'>{t('forms.gender')}</Label>
              <Select
                name='gender'
                value={formData.gender || "male"}
                onValueChange={(v) => handleSelectChange("gender", v)}>
                <SelectTrigger data-testid='gender-select'>
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
                data-testid='birth-date-input'
                type='text'
                placeholder='Year (e.g., 1990) or Date (e.g., 1990-01-01)'
                value={formData.birth_year || ""}
                onChange={handleInputChange}
              />
              {errors.birth_year && (
                <span data-testid='birth-date-error' className='text-red-500 text-sm mt-1 block'>
                  {errors.birth_year}
                </span>
              )}
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
            <Button type='submit' size='sm' className='flex-1' data-testid='submit-btn'>
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
