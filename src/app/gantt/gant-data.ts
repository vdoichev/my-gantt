import {TaskNode} from './gantt-interface';


export const EXAMPLE_DATA: TaskNode[] = [
  {
    id: 1,
    name: 'Причал № 1',
    owner: '125',
    status: '',
    priority: '',
    start: new Date('2026-01-25'),
    end: new Date('2026-02-10'),
    childrenDate: [],
    children: [
      {
        id: 21,
        name: 'LADY JAMILA, 9316983, Балкер',
        owner: '110',
        status: 'In Progress',
        priority: 'High',
        start: new Date('2026-01-25'),
        end: new Date('2026-02-05') },
      { id: 22, name: 'HIGHLAND-A, 9194452, Суховантаж', owner: '78', status: 'In Progress', priority: 'High', start: new Date('2026-02-07'), end: new Date('2026-02-10') },
    ]
  },
  {
    id: 2,
    name: 'Причал № 34',
    owner: '225,7',
    status: '',
    priority: '',
    start: new Date('2026-02-08'),
    end: new Date('2026-03-05'),
    childrenDate: [],
    children: [
      { id: 31, name: 'KAVO ALKYON, 9291121, Балкер', owner: '300', status: 'Open', priority: 'Medium', start: new Date('2026-02-08'), end: new Date('2026-02-15') },
    ]
  }
];
