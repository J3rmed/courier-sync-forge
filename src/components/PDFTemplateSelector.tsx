import { useState } from 'react';
import { PDFTemplate, ClientSegment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PDFTemplateSelectorProps {
  templates: PDFTemplate[];
  selectedSegment?: ClientSegment;
  onSelectTemplate: (template: PDFTemplate) => void;
}

export const PDFTemplateSelector = ({
  templates,
  selectedSegment,
  onSelectTemplate
}: PDFTemplateSelectorProps) => {
  const [selected, setSelected] = useState<string>(
    templates.find(t => t.segment === selectedSegment)?.id || templates[0]?.id
  );

  const handleSelect = (templateId: string) => {
    setSelected(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleccionar Plantilla de PDF</CardTitle>
        <CardDescription>
          Elige la plantilla que se aplicará al documento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selected} onValueChange={handleSelect}>
          {templates.map((template) => (
            <div key={template.id} className="flex items-center space-x-3 mb-4">
              <RadioGroupItem value={template.id} id={template.id} />
              <Label htmlFor={template.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {template.companyInfo.name}
                    </p>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: template.primaryColor,
                      color: '#ffffff'
                    }}
                  >
                    {template.segment}
                  </Badge>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
