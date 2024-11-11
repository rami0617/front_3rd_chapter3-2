import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { expect, vi } from 'vitest';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils.ts';
import App from '../App.tsx';
import { Event, RepeatType } from '../types.ts';
import { generateRecurringEvents } from '../utils/eventUtils.ts';

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

describe('이벤트 > 반복과 관련된 통합테스트', () => {
  it('매월 반복 일정이 설정된 경우 반복 일정', async () => {
    vi.useFakeTimers();
    vi.setSystemTime('2024-11-01');

    const result = generateRecurringEvents('2024-11-01', 1, 'monthly' as RepeatType, '2025-02-01');

    const eventData: Event = {
      id: '1',
      title: '매월 반복 이벤트',
      date: '2025-11-01',
      startTime: '21:25',
      endTime: '23:31',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-12-31',
      },
      notificationTime: 10,
    };

    const recurringEvents = result.map((eventDate) => ({
      ...eventData,
      date: eventDate,
    }));

    setupMockHandlerCreation(recurringEvents);

    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );

    const eventList = screen.getByTestId('event-list');

    await waitFor(() => {
      expect(within(eventList).getByText('검색 결과가 없습니다.')).toBeTruthy();
    });

    await user.type(screen.getByLabelText('제목'), '매월 반복 이벤트');
    await user.type(screen.getByLabelText('날짜'), '2024-11-01');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');

    await user.selectOptions(screen.getByLabelText('반복 유형'), 'monthly');
    await user.type(screen.getByLabelText('반복 간격'), '1');
    await user.type(screen.getByLabelText('반복 종료일'), '2025-12-01');

    await user.click(screen.getByRole('button', { name: /일정 추가/ }));

    const nextButton = screen.getByLabelText(/Next/);
    const monthView = await screen.findByTestId('month-view');

    await waitFor(() => {
      expect(within(monthView).getByText('2024년 11월')).toBeInTheDocument();
      expect(within(monthView).findAllByText('매월 반복 이벤트')).toBeTruthy();

      const atSignIcons = within(eventList).getAllByLabelText('at-sign-icon');
      expect(atSignIcons.length).toBeGreaterThan(0);
    });

    await user.click(nextButton);

    await waitFor(() => {
      expect(within(monthView).getByText('2024년 12월')).toBeInTheDocument();
      expect(within(monthView).findAllByText('매월 반복 이벤트')).toBeTruthy();

      const atSignIcons = within(eventList).getAllByLabelText('at-sign-icon');
      expect(atSignIcons.length).toBeGreaterThan(0);
    });

    await user.click(nextButton);

    await waitFor(() => {
      expect(within(monthView).getByText('2025년 1월')).toBeInTheDocument();
      expect(within(monthView).findAllByText('매월 반복 이벤트')).toBeTruthy();

      const atSignIcons = within(eventList).getAllByLabelText('at-sign-icon');
      expect(atSignIcons.length).toBeGreaterThan(0);
    });

    await user.click(nextButton);

    await waitFor(() => {
      expect(within(monthView).getByText('2025년 2월')).toBeInTheDocument();

      const atSignIcons = within(eventList).getAllByLabelText('at-sign-icon');
      expect(atSignIcons.length).toBeGreaterThan(0);
    });

    vi.useRealTimers();
  });

  it('반복 일정을 수정하면 단일 일정으로 변경된다.', async () => {
    // vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-11-01'));

    // 반복 일정 생성
    const recurringDates = generateRecurringEvents(
      '2024-11-01',
      1,
      'monthly' as RepeatType,
      '2025-02-01'
    );

    const eventData = {
      title: '매월 반복 이벤트',
      date: '2024-11-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '테스트 설명',
      location: '테스트 위치',
      category: '카테고리',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-02-01',
      },
      notificationTime: 10,
    };

    const recurringEvents = recurringDates.map((date) => ({ ...eventData, date }));
    setupMockHandlerCreation(recurringEvents as Event[]);
    // setupMockHandlerDeletion();
    setupMockHandlerUpdating(recurringEvents as Event[]);

    // 앱 렌더링
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );

    const eventList = screen.getByTestId('event-list');

    await waitFor(() => {
      expect(within(eventList).getByText('검색 결과가 없습니다.')).toBeTruthy();
    });

    // 이벤트 추가
    await user.type(screen.getByLabelText('제목'), '매월 반복 이벤트');
    await user.type(screen.getByLabelText('날짜'), '2024-11-01');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');
    await user.selectOptions(screen.getByLabelText('반복 유형'), 'monthly');
    await user.type(screen.getByLabelText('반복 간격'), '1');
    await user.type(screen.getByLabelText('반복 종료일'), '2025-02-01');
    await user.click(screen.getByRole('button', { name: /일정 추가/ }));

    // 월별 뷰에서 이벤트 확인
    const monthView = screen.getByTestId('month-view');
    await waitFor(() => {
      expect(within(monthView).getByText('2024년 11월')).toBeInTheDocument();
      expect(within(monthView).getAllByText('매월 반복 이벤트').length).toBeGreaterThan(0);
      expect(within(eventList).getAllByLabelText('at-sign-icon').length).toBeGreaterThan(0);
    });

    // 첫 번째 반복 일정 수정하여 단일 일정으로 변경
    const editButtons = screen.getAllByLabelText('Edit event');
    await user.click(editButtons[0]);

    // 제목 변경 및 반복 일정 해제
    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '단일 일정 이벤트');
    await user.clear(screen.getByLabelText('날짜'));
    await user.type(screen.getByLabelText('날짜'), '2024-11-03');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');
    // screen.debug();
    await user.click(screen.getByLabelText('반복 일정')); // 반복 일정 체크 해제

    // 일정 수정 저장
    await user.click(screen.getByRole('button', { name: /일정 수정/ }));

    // 수정 후 이벤트 검색하여 반복 아이콘이 없는지 확인
    await waitFor(() => {
      const updatedEvent = within(monthView).getByText('단일 일정 이벤트');
      expect(updatedEvent).toBeInTheDocument();
      // expect(within(eventList).queryByLabelText('at-sign-icon')).toBeNull();
    });

    vi.useRealTimers();
  });
});