'use client';

import Link from 'next/link';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { ArticleDto } from '@repo/shared';
import { formatDate } from '@/lib/date';
import CoverImage from './CoverImage';
import PublishStatusChip from './PublishStatusChip';
import TagChip from './TagChip';
import UserAvatar from './UserAvatar';

export default function ArticleCard({
  article,
  showStatus = false,
}: {
  article: ArticleDto;
  showStatus?: boolean;
}) {
  return (
    <Card sx={{ transition: 'border-color .2s', '&:hover': { borderColor: 'text.secondary' } }}>
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 1, textDecoration: 'none', alignItems: 'center' }}
            component={Link}
            href={`/profile/${article.author.username}`}
          >
            <UserAvatar
              name={article.author.name}
              src={article.author.avatarUrl}
              sx={{ width: 24, height: 24 }}
            />
            <Typography variant="body2" color="text.primary">
              {article.author.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              · {formatDate(article.publishedAt ?? article.createdAt)}
            </Typography>
            {showStatus && <PublishStatusChip published={article.published} />}
          </Stack>

          <Box
            component={Link}
            href={`/article/${encodeURIComponent(article.slug)}`}
            sx={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, lineHeight: 1.25, mb: 0.5 }}
            >
              {article.title}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {article.subtitle || article.excerpt} eieiei
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}
          >
            {article.tags.slice(0, 2).map((t) => (
              <TagChip key={t.id} tag={t} size="small" />
            ))}
            <Box sx={{ flex: 1 }} />
            <Stat icon={<FavoriteBorderIcon fontSize="inherit" />} value={article.likeCount} />
            <Stat icon={<ChatBubbleOutlineIcon fontSize="inherit" />} value={article.commentCount} />
            <Stat icon={<VisibilityOutlinedIcon fontSize="inherit" />} value={article.views} />
          </Stack>
        </Box>

        {article.coverImageUrl && (
          <CoverImage
            src={article.coverImageUrl}
            sx={{
              width: { xs: 90, sm: 160 },
              height: { xs: 90, sm: 100 },
              objectFit: 'cover',
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ color: 'text.secondary', fontSize: '0.85rem', alignItems: 'center' }}
    >
      {icon}
      <span>{value}</span>
    </Stack>
  );
}
