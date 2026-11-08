/**
 * Mock Module Data for ALS LMS Learner Portal
 * Module: Animals: Love Them and Care for Them (LS2-MOCK-001)
 * 29-page official ALS module with 10-item Pre-Test & 10-item Post-Test
 */

export const MOCK_MODULE_ID = 'ls2-mock-001';

export const MOCK_MODULE = {
  id: MOCK_MODULE_ID,
  title: 'Animals: Love Them and Care for Them',
  strand: 'LS2 – Scientific Literacy and Critical Thinking Skills',
  strandCode: 'LS2',
  strandKey: 'LS2-SCI',
  code: 'LS2-MOCK-001',
  type: 'PDF',
  totalPages: 29,
  fileUrl: '/modules/animals-love-them-and-care-for-them.pdf',
  description: 'Learn about the importance of animals to humans, how they contribute to our livelihood and ecosystem, and the proper ways of caring for and protecting them.',
  lessons: [
    { number: 1, title: 'What Will We Do Without You?', pages: 'Pages 3–8' },
    { number: 2, title: 'If Animals Protested, What Would Happen?', pages: 'Pages 9–19' }
  ],
  isMock: true
};

// 10-item Pre-Test (Diagnostic Assessment)
export const PRE_TEST_QUESTIONS = [
  {
    id: 1,
    question: 'Why are animals important to humans?',
    options: [
      { id: 'A', text: 'They only provide entertainment.' },
      { id: 'B', text: 'They provide food, protection, companionship, and help with work.' },
      { id: 'C', text: 'They are only useful on farms.' },
      { id: 'D', text: 'They do not contribute to our daily lives.' }
    ],
    correctAnswer: 'B',
    feedback: 'Animals help people by providing food, protection, companionship, and assistance with work.'
  },
  {
    id: 2,
    question: 'Which animal helps farmers cultivate their land?',
    options: [
      { id: 'A', text: 'Cat' },
      { id: 'B', text: 'Dog' },
      { id: 'C', text: 'Carabao' },
      { id: 'D', text: 'Chicken' }
    ],
    correctAnswer: 'C',
    feedback: 'Carabaos help farmers cultivate land for planting crops.'
  },
  {
    id: 3,
    question: 'What food product do we get from cows?',
    options: [
      { id: 'A', text: 'Eggs' },
      { id: 'B', text: 'Milk' },
      { id: 'C', text: 'Honey' },
      { id: 'D', text: 'Silk' }
    ],
    correctAnswer: 'B',
    feedback: 'Cows provide milk, which is an important food product.'
  },
  {
    id: 4,
    question: 'How do dogs help protect their owners?',
    options: [
      { id: 'A', text: 'By guarding their homes and alerting them to strangers' },
      { id: 'B', text: 'By producing eggs' },
      { id: 'C', text: 'By cultivating farmland' },
      { id: 'D', text: 'By making silk' }
    ],
    correctAnswer: 'A',
    feedback: 'Dogs can protect homes by guarding them and alerting people to possible danger.'
  },
  {
    id: 5,
    question: 'What do cats commonly help eliminate in homes?',
    options: [
      { id: 'A', text: 'Birds' },
      { id: 'B', text: 'Fish' },
      { id: 'C', text: 'Rats' },
      { id: 'D', text: 'Chickens' }
    ],
    correctAnswer: 'C',
    feedback: 'Cats help control pests such as rats.'
  },
  {
    id: 6,
    question: 'Which of the following is a proper way to care for animals?',
    options: [
      { id: 'A', text: 'Leave them without food.' },
      { id: 'B', text: 'Keep their surroundings dirty.' },
      { id: 'C', text: 'Give them enough food, clean water, and shelter.' },
      { id: 'D', text: 'Hurt them when they make mistakes.' }
    ],
    correctAnswer: 'C',
    feedback: 'Animals need food, clean water, safe shelter, and proper care to stay healthy.'
  },
  {
    id: 7,
    question: 'What should you do when your pet becomes sick?',
    options: [
      { id: 'A', text: 'Ignore it.' },
      { id: 'B', text: 'Bring it to a veterinarian.' },
      { id: 'C', text: 'Leave it outside.' },
      { id: 'D', text: 'Stop feeding it.' }
    ],
    correctAnswer: 'B',
    feedback: 'A veterinarian can provide proper medical treatment for sick animals.'
  },
  {
    id: 8,
    question: 'What is animal cruelty?',
    options: [
      { id: 'A', text: 'Feeding animals properly' },
      { id: 'B', text: 'Protecting endangered animals' },
      { id: 'C', text: 'Giving animals a safe shelter' },
      { id: 'D', text: 'Treating animals in an unkind or harmful way' }
    ],
    correctAnswer: 'D',
    feedback: 'Animal cruelty means treating animals badly or causing unnecessary harm.'
  },
  {
    id: 9,
    question: 'What does an endangered animal mean?',
    options: [
      { id: 'A', text: 'An animal that is at risk of disappearing completely' },
      { id: 'B', text: 'An animal commonly found in every home' },
      { id: 'C', text: 'An animal that is already extinct' },
      { id: 'D', text: 'An animal that cannot become sick' }
    ],
    correctAnswer: 'A',
    feedback: 'Endangered animals are at risk of becoming extinct if they are not protected.'
  },
  {
    id: 10,
    question: 'Which action helps protect animals and their habitats?',
    options: [
      { id: 'A', text: 'Destroying forests' },
      { id: 'B', text: 'Hunting endangered animals' },
      { id: 'C', text: 'Keeping the environment clean and protecting habitats' },
      { id: 'D', text: 'Throwing garbage into rivers' }
    ],
    correctAnswer: 'C',
    feedback: 'Protecting habitats and preventing pollution help conserve animals.'
  }
];

// 10-item Post-Test (Mastery Assessment)
export const POST_TEST_QUESTIONS = [
  {
    id: 1,
    question: 'Which statement best describes the importance of animals in our daily lives?',
    options: [
      { id: 'A', text: 'Animals are useful only as pets.' },
      { id: 'B', text: 'Animals provide food, protection, materials, companionship, and help with work.' },
      { id: 'C', text: 'Animals do not affect human livelihood.' },
      { id: 'D', text: 'Animals are only important in forests.' }
    ],
    correctAnswer: 'B',
    feedback: 'Animals provide food, materials, protection, companionship, and help with daily work.'
  },
  {
    id: 2,
    question: 'Which animal provides wool used for clothing?',
    options: [
      { id: 'A', text: 'Chicken' },
      { id: 'B', text: 'Sheep' },
      { id: 'C', text: 'Dog' },
      { id: 'D', text: 'Duck' }
    ],
    correctAnswer: 'B',
    feedback: 'Sheep provide wool, which can be used to make clothing and other materials.'
  },
  {
    id: 3,
    question: 'Why are small animals important to the ecosystem even if they do not directly help humans?',
    options: [
      { id: 'A', text: 'They help maintain the balance of the ecosystem and food chain.' },
      { id: 'B', text: 'They are all suitable as household pets.' },
      { id: 'C', text: 'They provide milk and eggs.' },
      { id: 'D', text: 'They can replace farm animals.' }
    ],
    correctAnswer: 'A',
    feedback: 'Animals help maintain the natural balance of ecosystems and food chains.'
  },
  {
    id: 4,
    question: 'In the story about Mang Berto, why did the animals want to leave him?',
    options: [
      { id: 'A', text: 'They wanted to find another farm.' },
      { id: 'B', text: 'They did not like working together.' },
      { id: 'C', text: 'They were treated cruelly and were not given proper care.' },
      { id: 'D', text: 'They wanted to live in a zoo.' }
    ],
    correctAnswer: 'C',
    feedback: "Mang Berto's animals complained because they were treated badly despite their hard work."
  },
  {
    id: 5,
    question: 'What lesson can we learn from Mang Berto’s story?',
    options: [
      { id: 'A', text: 'Animals should always work without rest.' },
      { id: 'B', text: 'Animals should be appreciated and treated with kindness.' },
      { id: 'C', text: 'Animals do not need food after working.' },
      { id: 'D', text: 'Animals should be punished for complaining.' }
    ],
    correctAnswer: 'B',
    feedback: 'We should appreciate animals and treat them with kindness and proper care.'
  },
  {
    id: 6,
    question: 'Why should animals have clean and safe shelters?',
    options: [
      { id: 'A', text: 'To prevent them from moving' },
      { id: 'B', text: 'To keep them away from all people' },
      { id: 'C', text: 'To protect them from danger and sickness' },
      { id: 'D', text: 'To prevent them from eating' }
    ],
    correctAnswer: 'C',
    feedback: 'Clean and safe shelters help protect animals from danger and disease.'
  },
  {
    id: 7,
    question: 'Why should dogs and cats be vaccinated against rabies?',
    options: [
      { id: 'A', text: 'To make them grow faster' },
      { id: 'B', text: 'To help protect them from rabies' },
      { id: 'C', text: 'To make them eat more' },
      { id: 'D', text: 'To change their behavior immediately' }
    ],
    correctAnswer: 'B',
    feedback: 'Rabies vaccination helps protect animals from a dangerous disease.'
  },
  {
    id: 8,
    question: 'What is the difference between endangered and extinct animals?',
    options: [
      { id: 'A', text: 'Endangered animals are already gone, while extinct animals still exist.' },
      { id: 'B', Both: false, text: 'Both terms mean that animals are common.' },
      { id: 'C', text: 'Endangered animals are at risk of disappearing, while extinct animals no longer exist.' },
      { id: 'D', text: 'Extinct animals can always be found in zoos.' }
    ],
    correctAnswer: 'C',
    feedback: 'Endangered animals are at risk of extinction, while extinct animals no longer exist.'
  },
  {
    id: 9,
    question: 'Which two animals are identified in the module as examples of endangered animals in the Philippines?',
    options: [
      { id: 'A', text: 'Philippine Eagle and Whale Shark' },
      { id: 'B', text: 'Dog and Cat' },
      { id: 'C', text: 'Chicken and Duck' },
      { id: 'D', text: 'Carabao and Cow' }
    ],
    correctAnswer: 'A',
    feedback: 'The Philippine Eagle and whale shark, also called butanding, are examples of endangered animals.'
  },
  {
    id: 10,
    question: 'Which action best demonstrates animal conservation?',
    options: [
      { id: 'A', text: 'Destroying animal habitats' },
      { id: 'B', text: 'Polluting rivers and forests' },
      { id: 'C', text: 'Hunting rare animals for entertainment' },
      { id: 'D', text: 'Protecting habitats, preventing pollution, and reporting illegal hunting' }
    ],
    correctAnswer: 'D',
    feedback: 'Conservation includes protecting animals and their habitats from harm.'
  }
];

import { calculateOverallModuleProgress } from '../utils/moduleProgress.js';

// Helper to get storage key scoped to current learner if available
export function getMockProgressStorageKey() {
  let userId = 'guest';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u?.id) userId = u.id;
    }
  } catch (e) {
    // ignore
  }
  return `als_mock_progress_${userId}_LS2-MOCK-001`;
}

// Initial default state
export function getDefaultMockProgress() {
  return {
    currentStep: 0, // 0: Overview, 1: Pre-Test, 2: Module, 3: Post-Test, 4: Activity Submission
    highestUnlockedStep: 1,
    preTestAnswers: {},
    preTestCompleted: false,
    preTestScore: 0,
    preTestTotal: 10,
    readingStarted: false,
    readingConfirmed: false,
    pdfCurrentPage: 1,
    pdfTotalPages: 29,
    pdfViewMode: 'long', // 'long' or 'wide'
    pagesRead: [],
    completedPages: 0,
    postTestAnswers: {},
    postTestCompleted: false,
    postTestScore: 0,
    postTestTotal: 10,
    activitySubmitted: false,
    submittedFilesMeta: [],
    completedAt: null
  };
}

// Load progress from localStorage
export function loadMockProgress() {
  const key = getMockProgressStorageKey();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return getDefaultMockProgress();
    const parsed = JSON.parse(raw);
    const pagesReadArr = Array.isArray(parsed.pagesRead)
      ? Array.from(new Set(parsed.pagesRead.map(Number).filter(n => n > 0))).sort((a, b) => a - b)
      : [];
    const totalPages = Number(parsed.pdfTotalPages) || 29;
    const isDone = Boolean(totalPages > 0 && pagesReadArr.length >= totalPages);

    return {
      ...getDefaultMockProgress(),
      ...parsed,
      pagesRead: pagesReadArr,
      completedPages: pagesReadArr.length,
      readingConfirmed: isDone
    };
  } catch (e) {
    console.error('Failed to parse mock progress', e);
    return getDefaultMockProgress();
  }
}

// Save progress to localStorage
export function saveMockProgress(progress) {
  const key = getMockProgressStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save mock progress', e);
  }
}

// Compute module card status: 'Not Started' | 'In Progress' | 'Completed'
export function getMockModuleStatus(progress = loadMockProgress()) {
  const pct = getMockModulePercentage(progress);
  if (pct === 100) {
    return 'Completed';
  }
  if (
    pct > 0 ||
    progress.preTestCompleted ||
    progress.readingStarted ||
    (progress.pagesRead && progress.pagesRead.length > 0) ||
    Object.keys(progress.preTestAnswers || {}).length > 0 ||
    progress.currentStep > 1
  ) {
    return 'In Progress';
  }
  return 'Not Started';
}

// Compute overall percentage for mock module
export function getMockModulePercentage(progress = loadMockProgress()) {
  const totalPages = Number(progress.pdfTotalPages) || 29;
  const pagesReadCount = Array.isArray(progress.pagesRead)
    ? progress.pagesRead.length
    : (Number(progress.completedPages) || 0);

  return calculateOverallModuleProgress({
    preTestCompleted: Boolean(progress.preTestCompleted),
    currentPage: Number(progress.pdfCurrentPage) || 1,
    highestPageReached: pagesReadCount,
    totalPages,
    postTestCompleted: Boolean(progress.postTestCompleted),
    activitySubmitted: Boolean(progress.activitySubmitted),
    isLegitimateFullCompletion: Boolean(progress.completedAt && progress.activitySubmitted && progress.postTestCompleted)
  });
}

