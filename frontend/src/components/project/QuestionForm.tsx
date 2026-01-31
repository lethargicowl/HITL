import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/common';
import {
  EvaluationType,
  EvaluationQuestionCreate,
  EvaluationQuestionUpdate,
  EvaluationQuestion,
  RatingConfig,
  BinaryConfig,
  MultiLabelConfig,
  MultiCriteriaConfig,
  PairwiseConfig,
  TextConfig,
} from '@/types';

interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EvaluationQuestionCreate | EvaluationQuestionUpdate) => Promise<void>;
  existingQuestion?: EvaluationQuestion;
  existingQuestions?: EvaluationQuestion[];
}

const questionTypeOptions = [
  { value: 'rating', label: 'Rating Scale' },
  { value: 'binary', label: 'Binary Choice' },
  { value: 'multi_label', label: 'Multi-Label Selection' },
  { value: 'multi_criteria', label: 'Multi-Criteria Rating' },
  { value: 'pairwise', label: 'Pairwise Comparison' },
  { value: 'text', label: 'Text Input' },
];

export function QuestionForm({
  isOpen,
  onClose,
  onSubmit,
  existingQuestion,
  existingQuestions = [],
}: QuestionFormProps) {
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [questionType, setQuestionType] = useState<EvaluationType>('rating');
  const [required, setRequired] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Config state
  const [ratingMin, setRatingMin] = useState(1);
  const [ratingMax, setRatingMax] = useState(5);
  const [ratingLabels, setRatingLabels] = useState<Record<string, string>>({});
  const [binaryOptions, setBinaryOptions] = useState([
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]);
  const [multiLabelOptions, setMultiLabelOptions] = useState([
    { value: 'option1', label: 'Option 1' },
  ]);
  const [multiLabelMinSelect, setMultiLabelMinSelect] = useState(0);
  const [multiLabelMaxSelect, setMultiLabelMaxSelect] = useState<number | null>(null);
  const [criteria, setCriteria] = useState([{ key: 'quality', label: 'Quality', min: 1, max: 5 }]);
  const [showConfidence, setShowConfidence] = useState(true);
  const [allowTie, setAllowTie] = useState(true);
  const [textPlaceholder, setTextPlaceholder] = useState('');
  const [textMaxLength, setTextMaxLength] = useState<number | undefined>(undefined);
  const [textMultiline, setTextMultiline] = useState(true);

  // Conditional
  const [hasConditional, setHasConditional] = useState(false);
  const [conditionalQuestion, setConditionalQuestion] = useState('');
  const [conditionalEquals, setConditionalEquals] = useState('');

  const isEditing = !!existingQuestion;

  useEffect(() => {
    if (existingQuestion) {
      setKey(existingQuestion.key);
      setLabel(existingQuestion.label);
      setDescription(existingQuestion.description || '');
      setQuestionType(existingQuestion.question_type);
      setRequired(existingQuestion.required);

      // Load config based on type
      const config = existingQuestion.config;
      if (existingQuestion.question_type === 'rating' && config) {
        const rc = config as RatingConfig;
        setRatingMin(rc.min || 1);
        setRatingMax(rc.max || 5);
        setRatingLabels(rc.labels || {});
      } else if (existingQuestion.question_type === 'binary' && config) {
        const bc = config as BinaryConfig;
        setBinaryOptions(bc.options || [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]);
      } else if (existingQuestion.question_type === 'multi_label' && config) {
        const mc = config as MultiLabelConfig;
        setMultiLabelOptions(mc.options || []);
        setMultiLabelMinSelect(mc.min_select || 0);
        setMultiLabelMaxSelect(mc.max_select ?? null);
      } else if (existingQuestion.question_type === 'multi_criteria' && config) {
        const mcc = config as MultiCriteriaConfig;
        setCriteria(mcc.criteria || []);
      } else if (existingQuestion.question_type === 'pairwise' && config) {
        const pc = config as PairwiseConfig;
        setShowConfidence(pc.show_confidence ?? true);
        setAllowTie(pc.allow_tie ?? true);
      } else if (existingQuestion.question_type === 'text' && config) {
        const tc = config as TextConfig;
        setTextPlaceholder(tc.placeholder || '');
        setTextMaxLength(tc.max_length);
        setTextMultiline(tc.multiline ?? true);
      }

      // Load conditional
      if (existingQuestion.conditional) {
        setHasConditional(true);
        setConditionalQuestion(existingQuestion.conditional.question);
        setConditionalEquals(String(existingQuestion.conditional.equals));
      }
    } else {
      resetForm();
    }
  }, [existingQuestion, isOpen]);

  const resetForm = () => {
    setKey('');
    setLabel('');
    setDescription('');
    setQuestionType('rating');
    setRequired(true);
    setRatingMin(1);
    setRatingMax(5);
    setRatingLabels({});
    setBinaryOptions([{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]);
    setMultiLabelOptions([{ value: 'option1', label: 'Option 1' }]);
    setMultiLabelMinSelect(0);
    setMultiLabelMaxSelect(null);
    setCriteria([{ key: 'quality', label: 'Quality', min: 1, max: 5 }]);
    setShowConfidence(true);
    setAllowTie(true);
    setTextPlaceholder('');
    setTextMaxLength(undefined);
    setTextMultiline(true);
    setHasConditional(false);
    setConditionalQuestion('');
    setConditionalEquals('');
  };

  const buildConfig = () => {
    switch (questionType) {
      case 'rating':
        return { min: ratingMin, max: ratingMax, labels: ratingLabels };
      case 'binary':
        return { options: binaryOptions };
      case 'multi_label':
        return { options: multiLabelOptions, min_select: multiLabelMinSelect, max_select: multiLabelMaxSelect };
      case 'multi_criteria':
        return { criteria };
      case 'pairwise':
        return { show_confidence: showConfidence, allow_tie: allowTie };
      case 'text':
        return { placeholder: textPlaceholder, max_length: textMaxLength, multiline: textMultiline };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const config = buildConfig();
      const conditional = hasConditional && conditionalQuestion
        ? { question: conditionalQuestion, equals: conditionalEquals }
        : undefined;

      if (isEditing) {
        await onSubmit({
          label,
          description: description || undefined,
          config,
          required,
          conditional,
        } as EvaluationQuestionUpdate);
      } else {
        await onSubmit({
          key,
          label,
          description: description || undefined,
          question_type: questionType,
          config,
          required,
          conditional,
        } as EvaluationQuestionCreate);
      }

      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Question' : 'Add Question'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="question-form" isLoading={isLoading}>
            {isEditing ? 'Update' : 'Add'} Question
          </Button>
        </>
      }
    >
      <form id="question-form" onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <Input
            label="Key"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            required
            placeholder="unique_key"
            helperText="Unique identifier (lowercase, underscores only)"
          />
        )}

        <Input
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          placeholder="Question label shown to raters"
        />

        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Help text for raters"
          rows={2}
        />

        {!isEditing && (
          <Select
            label="Question Type"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as EvaluationType)}
            options={questionTypeOptions}
          />
        )}

        {/* Type-specific config */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-3">Configuration</h4>

          {questionType === 'rating' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Value"
                  type="number"
                  value={ratingMin}
                  onChange={(e) => setRatingMin(Number(e.target.value))}
                />
                <Input
                  label="Max Value"
                  type="number"
                  value={ratingMax}
                  onChange={(e) => setRatingMax(Number(e.target.value))}
                />
              </div>
              <Input
                label="Min Label (optional)"
                value={ratingLabels[String(ratingMin)] || ''}
                onChange={(e) => setRatingLabels({ ...ratingLabels, [String(ratingMin)]: e.target.value })}
                placeholder="e.g., Poor"
              />
              <Input
                label="Max Label (optional)"
                value={ratingLabels[String(ratingMax)] || ''}
                onChange={(e) => setRatingLabels({ ...ratingLabels, [String(ratingMax)]: e.target.value })}
                placeholder="e.g., Excellent"
              />
            </div>
          )}

          {questionType === 'binary' && (
            <div className="space-y-3">
              {binaryOptions.map((opt, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <Input
                    label={`Option ${idx + 1} Value`}
                    value={opt.value}
                    onChange={(e) => {
                      const newOpts = [...binaryOptions];
                      newOpts[idx] = { ...newOpts[idx], value: e.target.value };
                      setBinaryOptions(newOpts);
                    }}
                  />
                  <Input
                    label={`Option ${idx + 1} Label`}
                    value={opt.label}
                    onChange={(e) => {
                      const newOpts = [...binaryOptions];
                      newOpts[idx] = { ...newOpts[idx], label: e.target.value };
                      setBinaryOptions(newOpts);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {questionType === 'multi_label' && (
            <div className="space-y-3">
              {multiLabelOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label={idx === 0 ? 'Option Value' : undefined}
                      value={opt.value}
                      onChange={(e) => {
                        const newOpts = [...multiLabelOptions];
                        newOpts[idx] = { ...newOpts[idx], value: e.target.value };
                        setMultiLabelOptions(newOpts);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label={idx === 0 ? 'Option Label' : undefined}
                      value={opt.label}
                      onChange={(e) => {
                        const newOpts = [...multiLabelOptions];
                        newOpts[idx] = { ...newOpts[idx], label: e.target.value };
                        setMultiLabelOptions(newOpts);
                      }}
                    />
                  </div>
                  {multiLabelOptions.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setMultiLabelOptions(multiLabelOptions.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setMultiLabelOptions([...multiLabelOptions, { value: '', label: '' }])}
              >
                Add Option
              </Button>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Input
                  label="Min Selections"
                  type="number"
                  value={multiLabelMinSelect}
                  onChange={(e) => setMultiLabelMinSelect(Number(e.target.value))}
                />
                <Input
                  label="Max Selections (empty = unlimited)"
                  type="number"
                  value={multiLabelMaxSelect ?? ''}
                  onChange={(e) => setMultiLabelMaxSelect(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
          )}

          {questionType === 'multi_criteria' && (
            <div className="space-y-3">
              {criteria.map((crit, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <Input
                    label={idx === 0 ? 'Key' : undefined}
                    value={crit.key}
                    onChange={(e) => {
                      const newCrit = [...criteria];
                      newCrit[idx] = { ...newCrit[idx], key: e.target.value };
                      setCriteria(newCrit);
                    }}
                    className="w-24"
                  />
                  <Input
                    label={idx === 0 ? 'Label' : undefined}
                    value={crit.label}
                    onChange={(e) => {
                      const newCrit = [...criteria];
                      newCrit[idx] = { ...newCrit[idx], label: e.target.value };
                      setCriteria(newCrit);
                    }}
                    className="flex-1"
                  />
                  <Input
                    label={idx === 0 ? 'Min' : undefined}
                    type="number"
                    value={crit.min}
                    onChange={(e) => {
                      const newCrit = [...criteria];
                      newCrit[idx] = { ...newCrit[idx], min: Number(e.target.value) };
                      setCriteria(newCrit);
                    }}
                    className="w-16"
                  />
                  <Input
                    label={idx === 0 ? 'Max' : undefined}
                    type="number"
                    value={crit.max}
                    onChange={(e) => {
                      const newCrit = [...criteria];
                      newCrit[idx] = { ...newCrit[idx], max: Number(e.target.value) };
                      setCriteria(newCrit);
                    }}
                    className="w-16"
                  />
                  {criteria.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}
                    >
                      X
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCriteria([...criteria, { key: '', label: '', min: 1, max: 5 }])}
              >
                Add Criterion
              </Button>
            </div>
          )}

          {questionType === 'pairwise' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showConfidence}
                  onChange={(e) => setShowConfidence(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Show confidence selector</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowTie}
                  onChange={(e) => setAllowTie(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Allow tie option</span>
              </label>
            </div>
          )}

          {questionType === 'text' && (
            <div className="space-y-3">
              <Input
                label="Placeholder"
                value={textPlaceholder}
                onChange={(e) => setTextPlaceholder(e.target.value)}
                placeholder="Enter your response..."
              />
              <Input
                label="Max Length (optional)"
                type="number"
                value={textMaxLength ?? ''}
                onChange={(e) => setTextMaxLength(e.target.value ? Number(e.target.value) : undefined)}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={textMultiline}
                  onChange={(e) => setTextMultiline(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Multiline input</span>
              </label>
            </div>
          )}
        </div>

        {/* Required checkbox */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium">Required question</span>
        </label>

        {/* Conditional */}
        {existingQuestions.length > 0 && (
          <div className="border rounded-lg p-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={hasConditional}
                onChange={(e) => setHasConditional(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Show conditionally</span>
            </label>

            {hasConditional && (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="When question"
                  value={conditionalQuestion}
                  onChange={(e) => setConditionalQuestion(e.target.value)}
                  options={[
                    { value: '', label: 'Select question...' },
                    ...existingQuestions
                      .filter((q) => q.key !== key)
                      .map((q) => ({ value: q.key, label: q.label })),
                  ]}
                />
                <Input
                  label="Equals value"
                  value={conditionalEquals}
                  onChange={(e) => setConditionalEquals(e.target.value)}
                  placeholder="e.g., yes, 5, option1"
                />
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
