export const questionConfig = [
  {
    weight: 2,
    id: "age",
    label: "年齢",
    placeholder: "年齢を選択してください",
    options: [
      { value: "18-24", label: "18-24歳", score: 2 },
      { value: "25-34", label: "25-34歳", score: 3 },
      { value: "35-44", label: "35-44歳", score: 2 },
      { value: "45+", label: "45歳以上", score: 1 }
    ]
  },
  {
    weight: 3,
    id: "occupation",
    label: "職業",
    placeholder: "現在の職業を選択してください",
    options: [
      { value: "student", label: "学生", score: 2 },
      { value: "office", label: "会社員（非IT）", score: 1 },
      { value: "it", label: "IT関連", score: 3 },
      { value: "freelance", label: "フリーランス", score: 2 },
      { value: "other", label: "その他", score: 1 }
    ]
  },
  {
    weight: 5,
    id: "pace",
    label: "学習ペース",
    placeholder: "週にどのくらい学習できますか？",
    options: [
      { value: "light", label: "週1-2時間（ゆっくり）", score: 1 },
      { value: "moderate", label: "週3-5時間（標準）", score: 2 },
      { value: "intensive", label: "週6時間以上（集中）", score: 3 }
    ]
  }
]
