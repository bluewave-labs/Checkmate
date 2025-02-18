import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { FaChevronDown } from 'react-icons/fa';
import { useTheme } from '@mui/material/styles';

export default function FAQ() {
  const [expanded, setExpanded] = React.useState([]);
  const theme = useTheme();

  const handleChange =
    (panel) => (event, isExpanded) => {
      setExpanded(
        isExpanded
          ? [...expanded, panel]
          : expanded.filter((item) => item !== panel),
      );
    };

  return (
    <Container
      id="faq"
      sx={{
        py: { xs: 24, sm: 24 },
        px: { xs: 12, sm: 12 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 3, sm: 6 },
      }}
    >
      <Typography
        component="h2"
        variant="h4"
        sx={{
          color: 'text.primary',
          width: { sm: '100%', md: '60%' },
          textAlign: { sm: 'left', md: 'center' },
          fontFamily: "BabaPro",
        }}
      >
        Frequently Asked Questions
      </Typography>
      <Box sx={{ width: '100%' }}>
        <Accordion
          expanded={expanded.includes('panel1')}
          onChange={handleChange('panel1')}
          sx={{
            borderRadius: 2,
            px: 6,
          }}
        >
          <AccordionSummary
            expandIcon={<FaChevronDown color={theme.palette.text.primary} />}
            aria-controls="panel1d-content"
            id="panel1d-header"
          >
            <Typography component="span" variant="subtitle1" sx={{ mr: 10, fontWeight: 'bold' }}>
              How does UpRock Prism ensure reliable uptime monitoring?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              gutterBottom
              sx={{ maxWidth: { sm: '100%', md: '70%' }, pb: 6 }}
            >
              UpRock Prism leverages a decentralized network of real devices across the globe, providing continuous and accurate monitoring of your website's uptime and performance.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded.includes('panel2')}
          onChange={handleChange('panel2')}
          sx={{
            borderRadius: 2,
            px: 6,
          }}
        >
          <AccordionSummary
            expandIcon={<FaChevronDown color={theme.palette.text.primary} />}
            aria-controls="panel2d-content"
            id="panel2d-header"
          >
            <Typography component="span" variant="subtitle1" sx={{ mr: 10, fontWeight: 'bold' }}>
              What kind of insights can I gain from UpRock Prism?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              gutterBottom
              sx={{ maxWidth: { sm: '100%', md: '70%' }, pb: 6 }}
            >
              UpRock Prism provides detailed insights into your website's performance, including load times, downtime incidents, and speed test metrics, helping you optimize and improve your digital presence.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded.includes('panel3')}
          onChange={handleChange('panel3')}
          sx={{
            borderRadius: 2,
            px: 6,
          }}
        >
          <AccordionSummary
            expandIcon={<FaChevronDown color={theme.palette.text.primary} />}
            aria-controls="panel3d-content"
            id="panel3d-header"
          >
            <Typography component="span" variant="subtitle1" sx={{ mr: 10, fontWeight: 'bold' }}>
              How does the decentralized network benefit my business?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              gutterBottom
              sx={{ maxWidth: { sm: '100%', md: '70%' }, pb: 6 }}
            >
              The decentralized network ensures that data is collected from diverse locations, providing a comprehensive view of your website's performance globally, and reducing the risk of single points of failure.
            </Typography>
          </AccordionDetails>
        </Accordion>
        {/* <Accordion
          expanded={expanded.includes('panel4')}
          onChange={handleChange('panel4')}
          sx={{
            borderRadius: 2,
            px: 6,
          }}
        >
          <AccordionSummary
            expandIcon={<FaChevronDown color={theme.palette.text.primary} />}
            aria-controls="panel4d-content"
            id="panel4d-header"
          >
            <Typography component="span" variant="subtitle1" sx={{ mr: 10, fontWeight: 'bold' }}>
              Is UpRock Prism easy to integrate with existing systems?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              gutterBottom
              sx={{ maxWidth: { sm: '100%', md: '70%' }, pb: 6 }}
            >
              Yes, UpRock Prism is designed to seamlessly integrate with your existing infrastructure, providing easy setup and compatibility with various platforms and tools.
            </Typography>
          </AccordionDetails>
        </Accordion> */}
      </Box>
    </Container>
  );
}
