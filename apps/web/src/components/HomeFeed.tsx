'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Chip,
  Container,
  Pagination,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { ArticleSort } from '@repo/shared';
import { fetchFeed } from '@/api/article';
import { fetchTags } from '@/api/tag';
import ArticleList from './ArticleList';
import TagChip from './TagChip';

const PAGE_SIZE = 10;

export default function HomeFeed() {
  const params = useSearchParams();
  const tag = params.get('tag') ?? undefined;
  const search = params.get('search') ?? undefined;

  const [sort, setSort] = useState<ArticleSort>('latest');
  const [page, setPage] = useState(1);

  // เปลี่ยนตัวกรอง (tag/search) แล้วกลับไปหน้าแรกเสมอ กัน fetch หน้าเกินของผลลัพธ์ใหม่
  useEffect(() => {
    setPage(1);
  }, [tag, search]);

  const feedQuery = useQuery({
    queryKey: ['feed', { tag, search, sort, page }],
    queryFn: () => fetchFeed({ tag, search, sort, page, pageSize: PAGE_SIZE }),
  });

  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: fetchTags });

  const heading = tag
    ? `บทความในหัวข้อ #${tag}`
    : search
      ? `ผลการค้นหา: “${search}”`
      : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', gap: 5, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* main */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {heading && (
            <Stack
              direction="row"
              sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography variant="h5">{heading}</Typography>
              <Chip label="ล้างตัวกรอง" component={Link} href="/" clickable />
            </Stack>
          )}

          <Tabs
            value={sort}
            onChange={(_, v: ArticleSort) => {
              setSort(v);
              setPage(1);
            }}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="ล่าสุด" value="latest" />
            <Tab label="ยอดนิยม" value="popular" />
          </Tabs>

          <ArticleList
            articles={feedQuery.data?.items}
            isLoading={feedQuery.isLoading}
            isError={feedQuery.isError}
            emptyText="ยังไม่มีบทความในหมวดนี้"
          />

          {feedQuery.data && feedQuery.data.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={feedQuery.data.totalPages}
                page={page}
                onChange={(_, p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
              />
            </Box>
          )}
        </Box>

        {/* sidebar */}
        <Box
          sx={{
            width: { md: 280 },
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Box sx={{ position: 'sticky', top: 88 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
              หัวข้อยอดนิยมสุดๆ
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tagsQuery.data?.map((t) => (
                <TagChip key={t.id} tag={t} active={tag === t.slug} />
              ))}
              {tagsQuery.data?.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีหัวข้อ
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
