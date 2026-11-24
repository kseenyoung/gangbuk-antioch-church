-- 강북안디옥교회 샘플 콘텐츠 데이터. 실제 예배 정보와 사진이 준비되면 관리자 화면에서 교체하세요.
insert into public.site_settings (key, value, updated_at) values
  ('pastor_name', '김승인', now()),
  ('pastor_title', '담임목사', now())
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.bulletins (title, description, file_url, published_at, is_published)
select '주보 예시 자료', '화면 확인용 샘플입니다. 실제 주보 PDF와 교회 소식으로 교체해 주세요.', 'https://kseenyoung.github.io/gangbuk-antioch-church/bulletin-sample.html', date '2026-11-24', true
where not exists (select 1 from public.bulletins where title = '주보 예시 자료');

insert into public.gallery_items (title, description, image_url, event_date, is_published, sort_order)
select '강북안디옥교회 전경', '강북안디옥교회 건물 모습입니다.', 'https://kseenyoung.github.io/gangbuk-antioch-church/public/assets/church.png', date '2026-11-24', true, 1
where not exists (select 1 from public.gallery_items where title = '강북안디옥교회 전경');
